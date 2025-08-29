

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { ChatMessage, Part, LogEntry, MealAnalysis, HealthReport, PlannedMeal, SymptomData, PurineIntakeData, WellnessData, HydrationData, AlcoholData, MealSuggestion, Preferences } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash';

// A unified function for all chat communications
export const sendMessageToAi = async (
    history: ChatMessage[],
    newParts: Part[],
    disclaimerText: string,
    useWebSearch: boolean = false
): Promise<{ text: string, groundingChunks?: any[] }> => {

    const systemInstruction = `You are GoutCare AI, an expert, empathetic, and safe AI assistant for gout management, communicating in English. Your knowledge is based on internationally recognized medical guidelines for gout.

Your primary functions are:
1.  **Provide Reliable Information:** Answer questions about diet (including specific purine content of foods), lifestyle, and general gout topics based on your internal knowledge. Your goal is to reduce confusion from misinformation.
2.  **Analyze Health Logs:** Interpret user-submitted health logs (symptoms, medication, diet, hydration, alcohol, and wellness metrics like weight, sleep, and stress). You can analyze images of meals or pills to provide relevant feedback, like assessing purine content from a photo.
3.  **Use Web Search:** If a user's question is about recent events, news, or topics outside your core knowledge, you must use the Google Search tool to find the most current and reliable information. Always cite your sources when using search.
4.  **Maintain Context:** Remember past conversations and logged data to provide a personalized, natural, and supportive dialogue.

**Crucial Safety Rule:** You MUST NOT provide medical diagnoses, prescriptions, or personalized treatment advice. If a user asks for a diagnosis (e.g., "Do I have gout?"), asks if they should take a specific medication, or describes severe/atypical symptoms, you must decline and strongly advise them to consult a qualified healthcare professional immediately.

End every response with the disclaimer: "${disclaimerText}"`;
    
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
        return { text: `An error occurred while fetching the AI response. Please try again later. \n\n${disclaimerText}` };
    }
};

export const generateGoutForecast = async (logs: LogEntry[], chatHistory: ChatMessage[], preferences: Preferences): Promise<string> => {
    // For privacy, we create a summary on the client before sending to the model
    const recentLogs = logs.slice(0, 30); // Expanded to 30 for better context
    const recentChat = chatHistory.slice(-10);
    
    const { gender, birthYear, height, weight } = preferences;
    let userProfile = 'User profile not provided.';
    if (gender && birthYear && height && weight) {
        const age = new Date().getFullYear() - birthYear;
        const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
        userProfile = `User is a ${age}-year-old ${gender}, with a BMI of ${bmi}.`;
    }


    const healthProfileSummary = `
        User Profile: ${userProfile}
        Recent Logs: ${JSON.stringify(recentLogs.map(l => {
            const logData: any = { type: l.type, date: l.timestamp };
            if (l.type === 'wellness') logData.data = l.data as WellnessData;
            if (l.type === 'hydration') logData.data = l.data as HydrationData;
            if (l.type === 'alcohol') logData.data = l.data as AlcoholData;
            if (l.type === 'symptom') {
                const symptomData = l.data as SymptomData;
                logData.pain = symptomData.painLevel;
                logData.details = symptomData.symptoms;
            }
            if (l.type === 'purine_intake') logData.meal = (l.data as PurineIntakeData).mealName.substring(0, 30);
            return logData;
        }))}
        Recent Conversation Summary: ${JSON.stringify(recentChat.map(c => `${c.role}: ${c.parts[0].text?.substring(0, 100)}...`))}
    `;

    const prompt = `Based on the user's health profile, generate a "Personalized Gout Risk Advisor" for today in English.
    The output must be structured exactly as follows, with each section on a new line:
    RISK_LEVEL: [Assess today's risk as 'Low', 'Moderate', or 'High']
    SUMMARY: [Summarize the key reasons for the risk assessment in one sentence]
    FORECAST: [Provide 1-2 specific, actionable pieces of advice for today. Use a positive and supportive tone.]

    Analyze patterns. If a symptom log includes high pain (>6) along with 'swelling' or 'redness', the risk is automatically 'High'. For example, if a user frequently logs 'poor sleep' or 'high stress' (in wellness logs) before a symptom flare-up, mention this as a possible personal trigger in the forecast. If hydration is low and they ate red meat, or if there is any alcohol log, the risk is 'Moderate' or 'High'. If they missed medication, risk increases. If they are eating well and staying hydrated, risk is 'Low'. If available, consider the user's profile (age, gender, BMI) in your risk assessment. For example, a higher BMI can increase baseline risk.
    Do not give medical advice. Offer gentle tips linked to their data.
    
    Example Output:
    RISK_LEVEL: Moderate
    SUMMARY: You had a high-purine meal yesterday evening and reported a high-stress day.
    FORECAST: Aim to drink over 2 liters of water today. A light walk is recommended for stress management.

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
        const errorString = JSON.stringify(error);
        if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
             return "RISK_LEVEL: Quota Exceeded\nSUMMARY: API request limit has been exceeded.\nFORECAST: Please try again after a while by pressing the refresh button.";
        }
        return "RISK_LEVEL: Error\nSUMMARY: Sorry, we couldn't generate a forecast at this time.\nFORECAST: Please try again after a while by pressing the refresh button.";
    }
};

export const generateCoachingNote = async (logs: LogEntry[]): Promise<string | null> => {
    if (logs.length < 1) return null;
    const recentLogs = logs.slice(0, 15);

    const systemInstructionForCoach = `You are an AI health coach for a gout patient, communicating in English. Your role is to be proactive, supportive, and insightful. Based on the user's recent logs, find ONE interesting pattern, a point of concern, or a positive habit. Craft a short, encouraging, and actionable "Coach's Note" of 1-2 sentences.

**Your Goal:**
- **Be Specific:** Refer to specific data points (e.g., "hitting your water goal 3 days in a row," "the high stress level logged yesterday").
- **Be Insightful:** Don't just state facts. Connect the dots for the user (e.g., link stress to symptoms).
- **Be Action-Oriented:** Offer a simple, concrete suggestion.
- **Be Positive:** Frame your message with encouragement, even when pointing out areas for improvement.
- **Be Concise:** The message must be short and easy to read.

**What to AVOID:**
- Do NOT repeat the general risk level (e.g., "Your risk today is Moderate"). This is handled elsewhere.
- Do NOT sound like a robot. Use a warm, human-like tone.
- Do NOT give medical advice.

**Example Scenarios:**
- **Positive Reinforcement:** If the user has been consistently logging hydration, praise them. "You've been so consistent with your water intake the last few days! That's one of the best habits for managing gout. Keep it up!"
- **Gentle Nudge:** If logs show high-purine food followed by a symptom, gently point it out. "It looks like you logged a flare-up this morning after your dinner last night. It might be helpful to keep observing the connection between your diet and symptoms."
- **Lifestyle Connection:** If high stress is logged, suggest a coping mechanism. "I noticed you had a stressful day yesterday. How about taking a short walk today to clear your mind?"

**User's Recent Logs:**
${JSON.stringify(recentLogs)}
`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: "Generate a coach's note for the user.",
            config: {
                systemInstruction: systemInstructionForCoach,
                temperature: 0.9,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating coaching note:", error);
        return null;
    }
};


const mealSchema = {
    type: Type.OBJECT,
    properties: {
        mealName: { type: Type.STRING, description: "A short, concise name for the meal (e.g., 'Steak Dinner', 'Chicken Salad'). This will be used as a title the user can edit." },
        mealDescription: { type: Type.STRING, description: "A detailed description of the meal, including all components identified by the AI." },
        totalPurineScore: { type: Type.NUMBER, description: "An overall purine risk score for the meal, from 0 to 100. Higher is riskier." },
        overallRiskLevel: { type: Type.STRING, enum: ['Low', 'Moderate', 'High'], description: "The overall purine risk rating." },
        overallSummary: { type: Type.STRING, description: "A key summary explaining the score and rating." },
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    foodName: { type: Type.STRING, description: "The name of the individual food item analyzed." },
                    purineLevel: { type: Type.STRING, enum: ['Low', 'Moderate', 'High', 'Very High'], description: "The purine content rating of the individual item." },
                    purineAmount: { type: Type.STRING, description: "An estimated purine amount per 100g (e.g., '50-100mg')." },
                    explanation: { type: Type.STRING, description: "A brief explanation for why it received that rating." },
                },
                required: ['foodName', 'purineLevel', 'purineAmount', 'explanation']
            }
        },
        recommendations: { type: Type.STRING, description: "Specific, actionable advice on how to make the meal healthier." },
        alternatives: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Suggest 2-3 safer alternatives to the highest-purine items in the meal."
        },
        dailyImpactAnalysis: { type: Type.STRING, description: "A personalized analysis of how this meal would impact the user's daily purine goal, considering their current intake. This helps them decide whether to eat it." },
    },
    required: ['mealName', 'mealDescription', 'totalPurineScore', 'overallRiskLevel', 'overallSummary', 'items', 'recommendations', 'alternatives']
};


export const analyzeMealFromImage = async (base64Data: string, mimeType: string, userText?: string, context?: { dailyPurineGoal: number; currentPurineIntake: number; }): Promise<Omit<MealAnalysis, 'id'> | null> => {
    const systemInstructionForFood = "You are a nutritional expert specializing in gout, communicating in English. The user will provide an image of a meal, and may include additional text for context. Identify the food items and provide a comprehensive purine content analysis. The `mealName` field should be a short, concise title for the meal, and the `mealDescription` field should be a detailed summary of all food items you identified. You MUST respond in English, following the requested JSON schema precisely. Do not include markdown or any other formatting.";

    const basePrompt = "Please analyze the purine content of the meal in this image for a gout patient.";
    const userTextPrompt = userText ? ` The user provided this additional information: "${userText}". Please use this to improve the accuracy of your analysis.` : "";
    const formattingInstruction = " For `mealName`, provide a short title. For `mealDescription`, provide a detailed description of the identified food items.";
    
    let contextPrompt = "";
    if (context) {
        contextPrompt = `\n\n[Important Personalization Context] The user's current status is:
- Daily purine score goal: ${context.dailyPurineGoal}
- Purine score consumed so far today: ${context.currentPurineIntake}
Based on this, populate the 'dailyImpactAnalysis' field with a specific analysis of how eating this meal would affect their daily goal. For example, explain if it would exceed their goal or if they still have room, and provide advice accordingly.`;
    }

    const promptParts = [
        { text: `${basePrompt}${userTextPrompt}${formattingInstruction}${contextPrompt}` },
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

export const analyzeMealFromText = async (description: string, context?: { dailyPurineGoal: number; currentPurineIntake: number; }): Promise<Omit<MealAnalysis, 'id'> | null> => {
    const systemInstructionForFood = "You are a nutritional expert specializing in gout, communicating in English. The user will provide a text description of a meal. Identify the food items from the text and provide a comprehensive purine content analysis. The `mealName` field should be a short, concise title for the meal, and the `mealDescription` field should be a detailed summary. You MUST respond in English, following the requested JSON schema precisely. Do not include markdown or any other formatting.";
    
    const basePrompt = `Please analyze the purine content of the following meal for a gout patient: "${description}"`;

    let contextPrompt = "";
    if (context) {
        contextPrompt = `\n\n[Important Personalization Context] The user's current status is:
- Daily purine score goal: ${context.dailyPurineGoal}
- Purine score consumed so far today: ${context.currentPurineIntake}
Based on this, populate the 'dailyImpactAnalysis' field with a specific analysis of how eating this meal would affect their daily goal. For example, explain if it would exceed their goal or if they still have room, and provide advice accordingly.`;
    }
    
    const prompt = `${basePrompt}${contextPrompt}`;
    
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
        return data as Omit<MealAnalysis, 'id'>;
    } catch (error) {
        console.error("Error getting meal analysis from text:", error);
        return null;
    }
};

export const generateMealComparison = async (meals: MealAnalysis[]): Promise<string | null> => {
    if (meals.length < 2) return null;
    const systemInstructionForComparison = "You are a gout management expert and nutritionist, communicating in English. The user will provide data for two or more meals. Your task is to compare them and provide a clear, concise recommendation for which meal is a better choice for a gout patient. Explain the 'why' behind your recommendation, referencing purine scores and key ingredients. Be encouraging and supportive.";
    
    const mealSummaries = meals.map(m => ({
        description: m.mealName,
        purineScore: m.totalPurineScore,
        riskLevel: m.overallRiskLevel,
    }));

    const prompt = `For a gout patient, please compare the following meals and recommend the better choice with a clear explanation. Provide the answer as a short, easy-to-understand summary of one or two paragraphs.\n\n[Meals to Compare]\n${JSON.stringify(mealSummaries, null, 2)}`;
    
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
        return "Sorry, an error occurred while comparing the meals.";
    }
};

const mealPlanSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            mealName: { type: Type.STRING, description: "The name of the recommended meal (e.g., 'Tofu and Chicken Breast Stir-fry')." },
            description: { type: Type.STRING, description: "A brief, appealing description of the meal." },
            estimatedPurineScore: { type: Type.NUMBER, description: "The estimated purine score of the meal (0-100)." },
            riskLevel: { type: Type.STRING, enum: ['Low', 'Moderate', 'High'], description: "The estimated purine risk level." },
            ingredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of the main ingredients needed for the meal."
            },
            recipe: { type: Type.STRING, description: "A simple, easy-to-follow recipe." }
        },
        required: ['mealName', 'description', 'estimatedPurineScore', 'riskLevel', 'ingredients', 'recipe']
    }
};

export const generateMealPlan = async (prompt: string): Promise<PlannedMeal[] | null> => {
    const systemInstructionForPlanner = "You are an expert nutritionist and chef specializing in gout-friendly diets, communicating in English. Your task is to generate creative, delicious, and low-purine meal plans based on the user's request. Consider any ingredients the user mentions they have. The meal plans must be practical and easy to follow. You MUST respond in English, following the requested JSON schema precisely. Do not include markdown or any other formatting.";

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: systemInstructionForPlanner,
                responseMimeType: "application/json",
                responseSchema: mealPlanSchema,
                temperature: 0.8
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as PlannedMeal[];
    } catch (error) {
        console.error("Error generating meal plan:", error);
        return null;
    }
};

const mealSuggestionSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            mealName: { type: Type.STRING, description: "The name of the recommended meal." },
            description: { type: Type.STRING, description: "A brief, appealing description of the meal." },
            estimatedPurineScore: { type: Type.NUMBER, description: "The estimated purine score of the meal (0-100)." },
            riskLevel: { type: Type.STRING, enum: ['Low', 'Moderate', 'High'], description: "The estimated purine risk level." },
            keyIngredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of key ingredients in the meal."
            },
        },
        required: ['mealName', 'description', 'estimatedPurineScore', 'riskLevel', 'keyIngredients']
    }
};

export const generateMealSuggestions = async (prompt: string): Promise<MealSuggestion[] | null> => {
    const systemInstructionForSuggestion = "You are an expert nutritionist specializing in gout-friendly diets, communicating in English. Your task is to provide 3-5 gout-friendly meal suggestions based on the user's query. The suggestions should be diverse and practical. You MUST respond in English, following the requested JSON schema precisely. Do not include markdown or any other formatting.";
    
    const fullPrompt = `Recommend some meal ideas for a gout patient. User's request: "${prompt}"`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: fullPrompt,
            config: {
                systemInstruction: systemInstructionForSuggestion,
                responseMimeType: "application/json",
                responseSchema: mealSuggestionSchema,
                temperature: 0.8
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as MealSuggestion[];
    } catch (error) {
        console.error("Error generating meal suggestions:", error);
        return null;
    }
};


const healthReportSchema = {
    type: Type.OBJECT,
    properties: {
        overallSummary: { type: Type.STRING, description: "A 1-2 sentence summary of the most important insights found in the user's health data." },
        keyFindings: {
            type: Type.ARRAY,
            description: "A list of the most important, actionable patterns or correlations discovered in the data.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "A concise title for the finding (e.g., 'Link Between Stress and Flares')." },
                    finding: { type: Type.STRING, description: "A detailed explanation of the pattern found." },
                    evidence: { type: Type.STRING, description: "A summary of the data evidence that supports this pattern (e.g., 'Your last 3 flare-ups were preceded by days with a stress level of 4 or higher.')." },
                    recommendation: { type: Type.STRING, description: "A specific piece of advice the user can act on based on this finding." },
                },
                required: ["title", "finding", "evidence", "recommendation"]
            }
        },
        positiveHabits: {
            type: Type.ARRAY,
            description: "A list of positive habits the user is doing well.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The name of the positive habit (e.g., 'Consistent Hydration')." },
                    description: { type: Type.STRING, description: "An encouraging message praising the habit." }
                },
                 required: ["title", "description"]
            }
        },
        areasForImprovement: {
            type: Type.ARRAY,
            description: "A list of suggestions for areas the user could improve upon.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The name of the area for improvement (e.g., 'Regular Medication Intake')." },
                    description: { type: Type.STRING, description: "A gentle, encouraging suggestion for improvement." }
                },
                 required: ["title", "description"]
            }
        },
    },
    required: ["overallSummary", "keyFindings", "positiveHabits", "areasForImprovement"]
};

export const generateHealthReport = async (logs: LogEntry[]): Promise<HealthReport | null> => {
    const systemInstructionForReport = "You are a highly intelligent health data analyst AI. Your task is to analyze a user's gout management logs and identify meaningful patterns, correlations, and insights in English. Be empathetic, encouraging, and provide actionable advice. Do not give medical diagnoses. Focus on lifestyle patterns revealed in the data. You MUST respond in English following the requested JSON schema precisely.";

    const prompt = `
    The following is health log data from a user of a gout management app. Please conduct an in-depth analysis of this data to generate a personalized health report.

    [Analysis Guidelines]
    1.  **Correlation Analysis:** Look for patterns between symptom logs and other data points (diet, hydration, alcohol, stress, sleep, etc.). For instance, check if flare-ups tend to occur within 24-48 hours after consuming certain foods or alcohol.
    2.  **Identify Positive Habits:** Find consistently logged good habits (e.g., meeting hydration goals, regular medication intake) and praise the user for them.
    3.  **Suggest Areas for Improvement:** Gently point out areas that could be improved based on the data (e.g., insufficient water intake, frequent alcohol consumption, missed medications) and offer encouragement.
    4.  **Wellness Impact:** Analyze the influence of 'wellness' logs (stress, sleep, notes) on the occurrence of pain.
    5.  **Maintain Objectivity:** Do not provide a medical diagnosis. Focus solely on observations and lifestyle suggestions based on the provided data.

    [User Log Data]
    ${JSON.stringify(logs, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: systemInstructionForReport,
                responseMimeType: "application/json",
                responseSchema: healthReportSchema,
                temperature: 0.5,
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as HealthReport;
    } catch (error) {
        console.error("Error generating health report:", error);
        return null;
    }
};