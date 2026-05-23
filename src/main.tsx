import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from './integrations/supabase/client'

// Load favicon from admin settings
(async () => {
  try {
    const { data } = await supabase
      .from('admin_settings')
      .select('favicon_url')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const url = (data as any)?.favicon_url;
    if (url) {
      document.querySelectorAll("link[rel~='icon']").forEach(l => l.parentNode?.removeChild(l));
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = url;
      document.head.appendChild(link);
    }
  } catch {}
})();

createRoot(document.getElementById("root")!).render(<App />);
