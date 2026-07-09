const fs = require('fs');

let content = fs.readFileSync('src/pages/Marketplace.tsx', 'utf8');

// Replace handleWhatsAppContact
content = content.replace(/const handleWhatsAppContact = \(\) => {[\s\S]*?};/, `
  const handleContact = () => {
    if (!selectedProduct) return;
    
    if (selectedProduct.contact_method === 'link') {
      window.open(selectedProduct.contact_info, '_blank');
      return;
    }
    
    if (selectedProduct.contact_method === 'phone') {
      window.open('tel:' + selectedProduct.contact_info, '_self');
      return;
    }

    // Default: whatsapp
    const phone = selectedProduct.contact_info || "9620000000";
    const text = \`مرحباً أ. \${selectedProduct.instructor_name}، أنا مهتم بالانضمام إلى "\${selectedProduct.title}" المعروضة على منصة طلاب الأردن. كيف يمكنني إكمال عملية التسجيل؟\`;
    window.open(\`https://wa.me/\${phone.replace(/\\+/g, '')}?text=\${encodeURIComponent(text)}\`, '_blank');
  };
`);

// Replace button onClick and text
content = content.replace(/onClick={handleWhatsAppContact}/g, 'onClick={handleContact}');
content = content.replace(/تواصل مع المدرب عبر واتس اب/g, '{selectedProduct?.contact_method === "link" ? "الانتقال للتسجيل / النموذج الخارجي" : selectedProduct?.contact_method === "phone" ? "اتصال هاتفي مع المدرب" : "تواصل مع المدرب عبر واتس اب"}');

// Replace MessageCircle with dynamic icon? Let's just leave MessageCircle or use generic
content = content.replace(/<MessageCircle className="w-5 h-5" \/>/g, '{selectedProduct?.contact_method === "link" ? <ArrowRight className="w-5 h-5 rotate-180" /> : <MessageCircle className="w-5 h-5" />}');

fs.writeFileSync('src/pages/Marketplace.tsx', content, 'utf8');
