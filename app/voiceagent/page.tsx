'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    chatWidgetScriptLoaded?: boolean;
    ChatWidgetConfig?: { projectId: string };
  }
}

const ChatWidget = () => {
  useEffect(() => {
    // Check if the script is already loaded
    if (window.chatWidgetScriptLoaded) return;

    // Configure the chat widget
    window.ChatWidgetConfig = {
      projectId: "681080aca4d449eb0ae34191",
    };

    // Create and append the script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = "https://storage.googleapis.com/cdwidget/dist/assets/js/main.js";
    script.async = true;
    document.body.appendChild(script);

    window.chatWidgetScriptLoaded = true;

    // Cleanup function
    return () => {
      document.body.removeChild(script);
      window.chatWidgetScriptLoaded = false;
    };
  }, []);

  return (
    <div 
      id="cd-widget"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
      }}
    />
  );
};

export default ChatWidget;