/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Sparkles, X, Send, ArrowRight, User, MapPin, Star, Wrench, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AiMatchmaker() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Akwaaba! Tell me the job you need done and where you are located. For example: “I need a plumber in East Legon” or “I need an electrician in Ashanti.” I will narrow the directory for you.',
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef(null);

  // Auto-scroll to latest messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    const promptText = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/matchmaker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: promptText })
      });

      const json = await response.json();

      if (response.ok && json.success) {
        const aiMsg = {
          id: Date.now() + 1,
          sender: 'ai',
          text: json.data.reply,
          timestamp: new Date(),
          matches: json.data.matchedArtisans || [],
          filters: {
            category_id: json.data.category_id,
            category_name: json.data.category_name,
            region: json.data.region
          },
          source: json.data.source
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        toast.error(json.error || 'Something went wrong. Please try again.');
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: "Oh, chale, I couldn't process that query correctly. Please try specifying a trade specialty (like Plumbing, Tailoring, Carpentry) and a location in Ghana.",
            timestamp: new Date()
          }
        ]);
      }
    } catch (err) {
      console.error('Matchmaker request error:', err);
      toast.error('Network error. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = (filters) => {
    const params = new URLSearchParams();
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.region) params.append('region', filters.region);
    
    toast.success(`Applied filters for ${filters.category_name || 'Trade'} in ${filters.region || 'Ghana'}!`);
    router.push(`/browse?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <div className="position-fixed bottom-0 end-0 m-3 z-5" id="ai-matchmaker-container">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-primary rounded-pill shadow-lg d-flex align-items-center gap-2 px-2.5 py-1.5 border-0 transition-all hover-scale"
          style={{ cursor: 'pointer', fontSize: '0.83rem' }}
          id="ai-matchmaker-trigger"
        >
          <Sparkles size={18} className="text-warning animate-pulse" />
          <span className="fw-semibold text-white">Find a trade</span>
          <span className="badge bg-secondary text-dark rounded-pill px-2 py-1 fs-9">Quick search</span>
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div 
          className="card shadow-lg border border-opacity-10 rounded-4 overflow-hidden bg-white d-flex flex-column"
          style={{
            width: '300px',
            maxWidth: '88vw',
            height: '480px',
            maxHeight: '70vh',
            boxShadow: '0 10px 28px rgba(0,0,0,0.12)'
          }}
          id="ai-matchmaker-chatbox"
        >
          {/* Header */}
          <div className="bg-primary text-white p-2 d-flex justify-content-between align-items-center border-bottom">
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-circle bg-white bg-opacity-20 p-1 d-flex align-items-center justify-content-center">
                <Sparkles size={16} className="text-warning" />
              </div>
              <div>
                <h6 className="fw-bold mb-0 text-white leading-tight" style={{ fontSize: '0.95rem' }}>Trade finder</h6>
                <small className="text-white-50 fs-9 d-flex align-items-center gap-1">
                  <span className="bg-success rounded-circle" style={{ width: '5px', height: '5px', display: 'inline-block' }}></span>
                  {messages.some((message) => message.source === 'local') ? 'Local directory matching' : 'Checking the directory'}
                </small>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="btn btn-link text-white p-1 border-0 shadow-none hover-scale"
              style={{ cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Viewport */}
          <div className="flex-grow-1 p-2 overflow-y-auto bg-light" style={{ fontSize: '13px' }}>
            <div className="d-flex flex-column gap-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`d-flex flex-column ${msg.sender === 'user' ? 'align-items-end' : 'align-items-start'}`}>
                  {/* Chat bubble */}
                  <div 
                    className={`p-3 rounded-4 shadow-sm w-fit ${
                      msg.sender === 'user' 
                        ? 'bg-primary text-white rounded-bottom-end-0 text-start' 
                        : 'bg-white text-dark rounded-bottom-start-0 text-start'
                    }`}
                    style={{ maxWidth: '85%', lineHeight: '1.5' }}
                  >
                    <div>{msg.text}</div>

                    {/* Filters application box */}
                    {msg.filters && (msg.filters.category_id || msg.filters.region) && (
                      <div className="mt-2 pt-2 border-top border-opacity-10 d-flex flex-column gap-1.5">
                        <div className="d-flex flex-wrap gap-1">
                          {msg.filters.category_name && (
                            <span className="badge bg-light text-primary px-2 py-1 fs-9 border">
                              🛠️ {msg.filters.category_name}
                            </span>
                          )}
                          {msg.filters.region && (
                            <span className="badge bg-light text-secondary px-2 py-1 fs-9 border">
                              📍 {msg.filters.region}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleApplyFilters(msg.filters)}
                          className="btn btn-primary btn-sm rounded-pill py-1 px-3 mt-1 fw-bold fs-9 d-flex align-items-center justify-content-center gap-1 text-white border-0"
                          style={{ cursor: 'pointer' }}
                        >
                          <span>Apply matching filters</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Matched Artisans inside chat! */}
                  {msg.matches && msg.matches.length > 0 && (
                    <div className="w-100 mt-2 text-start px-2">
                      <div className="fw-semibold text-muted mb-2 fs-8 text-uppercase">Recommended Profiles:</div>
                      <div className="d-flex flex-column gap-2">
                        {msg.matches.map((artisan, idx) => (
                          <div 
                            key={artisan.user_id || `match-${idx}`} 
                            onClick={() => router.push(`/artisan/${artisan.user_id}`)}
                            className="d-flex align-items-center gap-2 p-2 bg-white rounded-3 border custom-card-hover shadow-sm"
                            style={{ cursor: 'pointer' }}
                          >
                            <div 
                              className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle fw-bold flex-shrink-0"
                              style={{ width: '32px', height: '32px', fontSize: '11px' }}
                            >
                              {artisan.profile_photo ? (
                                <img 
                                  src={artisan.profile_photo} 
                                  alt={artisan.full_name} 
                                  className="rounded-circle w-100 h-100 object-cover" 
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                artisan.full_name.substring(0,2).toUpperCase()
                              )}
                            </div>
                            <div className="flex-grow-1 text-truncate" style={{ fontSize: '12px' }}>
                              <div className="fw-bold text-dark text-truncate leading-normal">{artisan.full_name}</div>
                              <div className="text-muted d-flex align-items-center gap-1 fs-8 text-truncate">
                                <MapPin size={10} className="text-primary" />
                                <span>{artisan.district}</span>
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-1 text-warning flex-shrink-0" style={{ fontSize: '11px' }}>
                              <Star size={12} fill="currentColor" />
                              <span className="fw-bold">{parseFloat(artisan.average_rating || 0).toFixed(1)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <small className="text-muted fs-9 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </div>
              ))}

              {/* Loader */}
              {isLoading && (
                <div className="d-flex flex-column align-items-start">
                  <div className="p-3 bg-white text-dark rounded-4 rounded-bottom-start-0 shadow-sm d-flex align-items-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-primary" />
                    <span>Checking local trade listings...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Form Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-top">
            <div className="input-group rounded-pill overflow-hidden border p-1 bg-light">
              <input
                type="text"
                className="form-control border-0 bg-transparent shadow-none ps-3 fs-7"
                placeholder="Describe what you need..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center p-2.5 border-0 shadow-sm text-white"
                style={{ width: '36px', height: '36px', cursor: 'pointer' }}
                disabled={isLoading || !inputValue.trim()}
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
