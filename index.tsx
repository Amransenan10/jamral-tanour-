
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error: any) {
  rootElement.innerHTML = `
    <div style="padding: 20px; color: white; background: #09090b; font-family: sans-serif; text-align: center;">
      <h1 style="color: #ea580c;">حدث خطأ أثناء تحميل التطبيق</h1>
      <p>${error.message}</p>
      <small style="color: #555;">يرجى التأكد من إعدادات البيئة (Environment Variables) في Vercel</small>
    </div>
  `;
}

