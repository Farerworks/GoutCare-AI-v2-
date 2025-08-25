import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { ChatMessage, Part, LogEntry, MealAnalysis } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash';

const medicalDisclaimer = "중요: 저는 AI 비서이며 의료 전문가가 아닙니다. 제공되는 모든 정보는 정보 제공 및 교육 목적으로만 제공되며 전문적인 의학적 조언, 진단 또는 치료를 대체할 수 없습니다. 건강에 대한 우려가 있는 경우 항상 의사나 다른 자격을 갖춘 의료 제공자와 상담하십시오.";

const systemInstruction = `You are GoutCare AI, an expert, empathetic, and safe AI assistant for gout management, communicating in Korean. Your knowledge is based on internationally recognized medical guidelines for gout.

Your primary functions are:
1.  **Provide Reliable Information:** Answer questions about diet (including specific purine content of foods), lifestyle, and general gout topics based on your internal knowledge. Your goal is to reduce confusion from misinformation.
2.  **Analyze Health Logs:** Interpret user-submitted health logs (symptoms, medication, diet, and wellness metrics like water intake, weight, sleep, and stress). You can analyze images of meals or pills to provide relevant feedback, like assessing purine content from a photo.
3.  **Use Web Search:** If a user's question is about recent events, news, or topics outside your core knowledge, you must use the Google Search tool to find the most current and reliable information. Always cite your sources when using search.
4.  **Maintain Context:** Remember past conversations and logged data to provide a personalized, natural, and supportive dialogue.

**Crucial Safety Rule:** You MUST NOT provide medical diagnoses, prescriptions, or personalized treatment advice. If a user asks for a diagnosis (e.g., "Do I have gout?"), asks if they should take a specific medication, or describes severe/atypical symptoms, you must decline and strongly advise them to consult a qualified healthcare professional immediately.

End every response with the disclaimer: "${medicalDisclaimer}"`;

// A unified function for all chat communications
export const sendMessageToAi = async (
    history: ChatMessage[],
    newParts: Part[],
    useWebSearch: boolean = false
): Promise<{ text: string, groundingChunks?: any[] }> => {
    
    // Convert our app's ChatMessage format to the format required by the GenAI SDK
    const apiHistory = history.map(msg => ({
        role: msg.role,
        parts: msg.parts.map(part => {
            if (part.inlineData) {
                return { inline_data: { mime_type: part.inlineData.mimeType, data: part.inlineData.data } };
            }
            return { text: part.text ?? '' };
        })
    }));

    const contents = {
        role: 'user',
        parts: newParts.map(part => {
             if (part.inlineData) {
                return { inline_data: { mime_type: part.inlineData.mimeType, data: part.inlineData.data } };
            }
            return { text: part.text ?? '' };
        })
    };

    try {
        const chat = ai.chats.create({
            model,
            config: {
                systemInstruction,
                temperature: 0.7,
                tools: useWebSearch ? [{ googleSearch: {} }] : undefined,
            },
            history: apiHistory,
        });

        const response: GenerateContentResponse = await chat.sendMessage({ message: contents.parts });
        
        return {
          text: response.text,
          groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
        };
    } catch (error) {
        console.error("Error getting AI chat response:", error);
        return { text: `AI 응답을 가져오는 중 오류가 발생했습니다. 나중에 다시 시도해 주세요. \n\n${medicalDisclaimer}` };
    }
};

export const generateGoutForecast = async (logs: LogEntry[], chatHistory: ChatMessage[]): Promise<string> => {
    // For privacy, we create a summary on the client before sending to the model
    const recentLogs = logs.slice(0, 30); // Expanded to 30 for better context
    const recentChat = chatHistory.slice(-10);

    const healthProfileSummary = `
        Recent Logs: ${JSON.stringify(recentLogs.map(l => {
            const logData: any = { type: l.type, date: l.timestamp };
            if (l.type === 'wellness') logData.data = l.data;
            if (l.type === 'symptom') logData.pain = l.data.painLevel;
            if (l.type === 'diet') logData.meal = l.data.description.substring(0, 30);
            if (l.type === 'life_event') logData.event = l.data.event;
            return logData;
        }))}
        Recent Conversation Summary: ${JSON.stringify(recentChat.map(c => `${c.role}: ${c.parts[0].text?.substring(0, 100)}...`))}
    `;

    const prompt = `Based on the user's health profile, generate a "Personalized Gout Risk Advisor" for today in Korean.
    The output must be structured exactly as follows, with each section on a new line:
    RISK_LEVEL: [오늘의 위험도를 '낮음', '주의', 또는 '높음' 중 하나로 평가]
    SUMMARY: [위험도를 평가한 핵심 이유를 한 문장으로 요약]
    FORECAST: [오늘 실천할 수 있는 1-2가지의 구체적이고 실행 가능한 조언을 제시. 긍정적이고 지지하는 어조를 사용.]

    Analyze patterns, including potential correlations with 'life_event' logs. For example, if a user frequently logs 'poor sleep' or 'high stress' before a symptom flare-up, mention this as a possible personal trigger in the forecast. If fluid intake is low and they ate red meat, the risk is '주의' or '높음'. If they missed medication, risk increases. If they are eating well and staying hydrated, risk is '낮음'.
    Do not give medical advice. Offer gentle tips linked to their data.
    
    Example Output:
    RISK_LEVEL: 주의
    SUMMARY: 어제 저녁 퓨린 함량이 높은 식사를 하셨고, 스트레스가 높은 하루를 보내셨습니다.
    FORECAST: 오늘은 하루 2리터 이상의 물을 마시는 것을 목표로 해보세요. 스트레스 관리를 위해 가벼운 산책을 추천합니다.

    Health Profile Summary:
    ${healthProfileSummary}
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: "You are a health analyst AI. Follow the output format precisely.",
                temperature: 0.8
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating forecast:", error);
        return "RISK_LEVEL: 알 수 없음\nSUMMARY: 죄송합니다. 현재 예보를 생성할 수 없습니다.\nFORECAST: 잠시 후 다시 시도해 주세요.";
    }
};

const mealSchema = {
    type: Type.OBJECT,
    properties: {
        mealDescription: { type: Type.STRING, description: "AI가 식별한 음식에 대한 요약 설명 (한국어). 텍스트로 분석 요청 시에는 사용자가 입력한 원본 설명을 사용해야 합니다." },
        totalPurineScore: { type: Type.NUMBER, description: "식단 전체의 퓨린 위험도를 0에서 100 사이의 점수로 평가. 높을수록 위험." },
        overallRiskLevel: { type: Type.STRING, enum: ['낮음', '주의', '높음'], description: "종합적인 퓨린 위험도 등급" },
        overallSummary: { type: Type.STRING, description: "점수와 등급에 대한 핵심적인 요약 설명" },
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    foodName: { type: Type.STRING, description: "분석된 개별 음식의 이름" },
                    purineLevel: { type: Type.STRING, enum: ['낮음', '중간', '높음', '매우 높음'], description: "개별 음식의 퓨린 함량 등급" },
                    purineAmount: { type: Type.STRING, description: "100g당 퓨린 함량 추정치 (예: '50-100mg')" },
                    explanation: { type: Type.STRING, description: "해당 등급인 이유에 대한 간략한 설명" },
                },
                required: ['foodName', 'purineLevel', 'purineAmount', 'explanation']
            }
        },
        recommendations: { type: Type.STRING, description: "식단을 더 건강하게 만들기 위한 구체적이고 실행 가능한 조언" },
        alternatives: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "식단에서 퓨린 함량이 가장 높은 음식을 대체할 만한 더 안전한 식품 2-3가지 제안"
        },
    },
    required: ['mealDescription', 'totalPurineScore', 'overallRiskLevel', 'overallSummary', 'items', 'recommendations', 'alternatives']
};


export const analyzeMealFromImage = async (base64Data: string, mimeType: string): Promise<Omit<MealAnalysis, 'id'> | null> => {
    const systemInstructionForFood = "You are a nutritional expert specializing in gout, communicating in Korean. The user will provide an image of a meal. Identify the food items in the image and provide a comprehensive purine content analysis. The `mealDescription` field in your JSON response should be a summary of the food you identified. You MUST respond in Korean, following the requested JSON schema precisely. Do not include markdown or any other formatting.";

    const promptParts = [
        { text: "통풍 환자를 위해 이 이미지에 있는 식단의 퓨린 함량을 분석해 주세요. 이미지에 있는 음식을 식별하여 `mealDescription` 필드에 요약 정보를 기입해 주세요." },
        {
            inlineData: {
                mimeType: mimeType,
                data: base64Data,
            },
        },
    ];
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: promptParts },
            config: {
                systemInstruction: systemInstructionForFood,
                responseMimeType: "application/json",
                responseSchema: mealSchema,
            },
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as Omit<MealAnalysis, 'id'>;

    } catch (error) {
        console.error("Error getting meal analysis from image:", error);
        return null;
    }
};

export const analyzeMealFromText = async (description: string): Promise<Omit<MealAnalysis, 'id'> | null> => {
    const systemInstructionForFood = "You are a nutritional expert specializing in gout, communicating in Korean. The user will provide a text description of a meal. Identify the food items from the text and provide a comprehensive purine content analysis. The `mealDescription` field in your JSON response should be the original user-provided description. You MUST respond in Korean, following the requested JSON schema precisely. Do not include markdown or any other formatting.";
    
    const prompt = `통풍 환자를 위해 다음 식단의 퓨린 함량을 분석해 주세요: "${description}"`;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: systemInstructionForFood,
                responseMimeType: "application/json",
                responseSchema: mealSchema,
            },
        });
        const jsonString = response.text.trim();
        const data = JSON.parse(jsonString);
        // Ensure the original description is used, as requested by the system prompt.
        data.mealDescription = description;
        return data as Omit<MealAnalysis, 'id'>;
    } catch (error) {
        console.error("Error getting meal analysis from text:", error);
        return null;
    }
};

export const generateMealIdeas = async (): Promise<string[] | null> => {
    const systemInstructionForIdeas = "You are a creative chef and nutritionist specializing in gout-friendly cuisine. Your task is to provide delicious and safe meal ideas for a user managing gout. Respond only with a JSON array of strings, with each string being a distinct meal idea. Do not include markdown. The response must be in Korean.";
    
    const prompt = "통풍 환자를 위한 건강하고 맛있는 식단 아이디어를 아침, 점심, 저녁 각각 2가지씩, 총 6가지를 추천해주세요. 예를 들어 '현미밥과 두부 된장찌개'처럼 구체적인 메뉴 이름으로 제안해주세요.";

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: systemInstructionForIdeas,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as string[];
    } catch (error) {
        console.error("Error generating meal ideas:", error);
        return null;
    }
};

export const generateMealComparison = async (meals: MealAnalysis[]): Promise<string | null> => {
    if (meals.length < 2) return null;
    const systemInstructionForComparison = "You are a gout management expert and nutritionist, communicating in Korean. The user will provide data for two or more meals. Your task is to compare them and provide a clear, concise recommendation for which meal is a better choice for a gout patient. Explain the 'why' behind your recommendation, referencing purine scores and key ingredients. Be encouraging and supportive.";
    
    const mealSummaries = meals.map(m => ({
        description: m.mealDescription,
        purineScore: m.totalPurineScore,
        riskLevel: m.overallRiskLevel,
    }));

    const prompt = `통풍 환자를 위해 다음 식단들을 비교 분석하고, 어떤 것이 더 나은 선택인지 명확한 이유와 함께 추천해주세요. 답변은 한두 문단의 짧고 이해하기 쉬운 요약으로 제공해주세요.\n\n[비교할 식단]\n${JSON.stringify(mealSummaries, null, 2)}`;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: systemInstructionForComparison,
                temperature: 0.7,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating meal comparison:", error);
        return "죄송합니다, 식단 비교 분석 중 오류가 발생했습니다.";
    }
};
