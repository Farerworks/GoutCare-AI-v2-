import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { sendMessageToAi } from '../services/geminiService';
import type { ChatMessage, Part } from '../types';
import Button from './common/Button';
import Spinner from './common/Spinner';
import Card from './common/Card';
import { SendIcon, PaperclipIcon, SearchIcon, XIcon, SparklesIcon, MicrophoneIcon } from './Icons';

// Simple markdown to HTML renderer
const renderMarkdown = (text: string) => {
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\n/g, '<br />'); // Newlines
    
    // Lists
    html = html.replace(/(\<br \/\>(\*|-)\s.*)+/g, (match) => {
        const items = match.split('<br />').filter(item => item.trim() !== '').map(item => `<li>${item.replace(/(\*|-)\s/, '')}</li>`).join('');
        return `<ul>${items}</ul>`;
    });

    return html;
};

const Message: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
    return (
        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                msg.role === 'user' ? 'bg-sky-600 text-white rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
            }`}>
                {msg.parts.map((part, i) => (
                    <div key={i}>
                        {part.text && <div dangerouslySetInnerHTML={{ __html: renderMarkdown(part.text) }} />}
                        {part.inlineData && (
                            <img src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="user upload" className="mt-2 rounded-lg max-h-48" />
                        )}
                    </div>
                ))}
                 {msg.role === 'model' && msg.groundingChunks && msg.groundingChunks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-300 dark:border-slate-600">
                        <h4 className="text-xs font-semibold mb-2">출처:</h4>
                        <ul className="space-y-1">
                            {msg.groundingChunks.map((chunk, i) => chunk.web && (
                                <li key={i}>
                                    <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 dark:text-sky-400 hover:underline break-all">
                                        {chunk.web.title || chunk.web.uri}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                 )}
            </div>
        </div>
    );
};

const SuggestionChips: React.FC<{ onSuggestionClick: (prompt: string) => void }> = ({ onSuggestionClick }) => {
    const suggestionPrompts = [
        "통풍에 좋은 식단 추천해줘",
        "요산 수치를 낮추는 방법 알려줘",
        "맥주가 왜 안좋은지 설명해줘",
    ];

    return (
        <div className="p-4 flex flex-col items-center justify-center h-full">
            <SparklesIcon className="w-12 h-12 text-yellow-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">AI 비서</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">무엇이든 물어보세요!</p>
            <div className="flex flex-wrap justify-center gap-2">
                {suggestionPrompts.map(prompt => (
                    <button 
                        key={prompt} 
                        onClick={() => onSuggestionClick(prompt)} 
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
    );
};


interface ChatPanelProps {
    history: ChatMessage[];
    setHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export interface ChatPanelRef {
    addMessage: (message: ChatMessage) => void;
}

const ChatPanel = forwardRef<ChatPanelRef, ChatPanelProps>(({ history, setHistory }, ref) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [image, setImage] = useState<{ file: File, preview: string } | null>(null);
    const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [history, isLoading]);

    // Speech Recognition Effect
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            const recognition = recognitionRef.current;
            recognition.continuous = false;
            recognition.lang = 'ko-KR';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + transcript);
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };
            
            recognition.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
        setIsListening(!isListening);
    };

    const handleSendMessage = useCallback(async (userMessage: ChatMessage) => {
        setIsLoading(true);
        setHistory(prev => [...prev, userMessage]);

        const { text, groundingChunks } = await sendMessageToAi(history, userMessage.parts, useWebSearch);
        
        const modelMessage: ChatMessage = { 
            role: 'model',
            parts: [{ text }],
            timestamp: new Date().toISOString(),
            groundingChunks
        };
        setHistory(prev => [...prev, modelMessage]);
        setIsLoading(false);
    }, [history, setHistory, useWebSearch]);
    
    // Expose addMessage to parent component
    useImperativeHandle(ref, () => ({
        addMessage(message: ChatMessage) {
            handleSendMessage(message);
        }
    }));


    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && !image) || isLoading) return;

        const parts: Part[] = [];
        if (input.trim()) {
            parts.push({ text: input });
        }
        if (image) {
            const base64Data = await fileToBase64(image.file);
            parts.push({
                inlineData: {
                    mimeType: image.file.type,
                    data: base64Data
                }
            });
        }
        
        handleSendMessage({ role: 'user', parts, timestamp: new Date().toISOString() });
        setInput('');
        setImage(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage({ file, preview: URL.createObjectURL(file) });
        }
    };
    
    const handleSuggestionClick = (prompt: string) => {
        setInput(prompt);
    };

    return (
        <Card className="flex-grow flex flex-col h-full !p-0">
             <h2 className="text-xl font-bold text-slate-900 dark:text-white p-4 border-b border-slate-200 dark:border-slate-700 text-center">AI 비서</h2>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {history.length === 0 && !isLoading && <SuggestionChips onSuggestionClick={handleSuggestionClick} />}
                {history.map((msg, index) => <Message key={index} msg={msg} />)}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-200 dark:bg-slate-700 rounded-2xl rounded-bl-none p-4">
                            <Spinner />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                {image && (
                     <div className="relative w-24 h-24 mb-2">
                        <img src={image.preview} alt="preview" className="w-full h-full object-cover rounded-lg" />
                        <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-slate-600 text-white rounded-full p-1">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <form onSubmit={handleFormSubmit} className="flex items-center space-x-2">
                     <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                     <Button type="button" onClick={() => fileInputRef.current?.click()} variant="secondary" className="rounded-full !p-3" aria-label="Attach image">
                         <PaperclipIcon />
                     </Button>
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "듣고 있어요..." : "메시지 입력..."}
                            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 pr-12"
                            disabled={isLoading}
                        />
                         {recognitionRef.current && (
                            <button type="button" onClick={toggleListening} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                                <MicrophoneIcon className="w-5 h-5"/>
                            </button>
                        )}
                    </div>
                    <Button type="submit" disabled={isLoading || (!input.trim() && !image)} className="rounded-full !p-3" aria-label="Send message">
                        <SendIcon />
                    </Button>
                </form>
                <div className="flex items-center justify-end mt-2">
                    <label htmlFor="web-search-toggle" className="flex items-center cursor-pointer">
                        <span className="mr-2 text-sm text-slate-600 dark:text-slate-400">웹 검색</span>
                        <div className="relative">
                            <input type="checkbox" id="web-search-toggle" className="sr-only" checked={useWebSearch} onChange={() => setUseWebSearch(!useWebSearch)} />
                            <div className="block bg-slate-300 dark:bg-slate-600 w-10 h-6 rounded-full"></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${useWebSearch ? 'translate-x-full bg-sky-500' : ''}`}></div>
                        </div>
                    </label>
                </div>
            </div>
        </Card>
    );
});

export default ChatPanel;