// كود لتنشيط القائمة المتنقلة على الهواتف
document.addEventListener('DOMContentLoaded', function() {
    // يمكنك إضافة أي تفاعلات تحتاجها هنا
    
    // مثال: إضافة فئة active عند النقر على عنصر القائمة
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // كود لمعالجة النماذج (يمكن فصله في ملف forms.js)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('شكراً لتواصلكم، سنرد عليكم قريباً!');
            this.reset();
        });
    }
});