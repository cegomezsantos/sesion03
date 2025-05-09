document.addEventListener('DOMContentLoaded', () => {
  // 1. Animaciones al hacer scroll
  const scrollElements = document.querySelectorAll('.animate-on-scroll');
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  scrollElements.forEach(el => scrollObserver.observe(el));

  // 2. Toggle para mostrar/ocultar resultado de ejemplo (Paso 2)
  const toggleBtn = document.getElementById('toggleOutputBtn');
  const exampleContent = document.getElementById('iaOutputContent');
  if (toggleBtn && exampleContent) {
    toggleBtn.addEventListener('click', () => {
      exampleContent.classList.toggle('open');
      toggleBtn.textContent = exampleContent.classList.contains('open') ? 'Ocultar Resultado Ejemplo' : 'Mostrar Resultado Ejemplo';
    });
  }

  // 3. Análisis de prompt inicial (Paso 4)
  const analyzeBtn = document.getElementById('analyzeBtn');
  const retryBtn = document.getElementById('retryBtn');
  const rolInput = document.getElementById('rolInput');
  const objetivoInput = document.getElementById('objetivoInput');
  const contextoInput = document.getElementById('contextoInput');
  const feedback4 = document.getElementById('step4Feedback');

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
      const rol = rolInput.value.trim();
      const objetivo = objetivoInput.value.trim();
      const contexto = contextoInput.value.trim();
      if (!rol || !objetivo || !contexto) {
        feedback4.textContent = 'Por favor completa todos los campos.';
        return;
      }
      analyzeBtn.disabled = true;
      analyzeBtn.textContent = 'Analizando...';
      feedback4.textContent = '';
      retryBtn.style.display = 'none';
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rol, objetivo, contexto })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        feedback4.innerHTML = `<strong>Puntaje:</strong> ${data.score} ${data.ok ? '✅' : '❌'}<br>${data.suggestions}`;
        retryBtn.style.display = 'inline-block';
      } catch (err) {
        feedback4.textContent = `Error al analizar: ${err.message}`;
        retryBtn.style.display = 'inline-block';
      } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analizar Prompt';
      }
    });
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      rolInput.value = '';
      objetivoInput.value = '';
      contextoInput.value = '';
      feedback4.textContent = '';
      retryBtn.style.display = 'none';
    });
  }

  // 4. Evaluación de prompt final (Paso 5)
  const evalBtn = document.getElementById('evaluatePrompt');
  const studentPrompt = document.getElementById('studentPrompt');
  const feedback5 = document.getElementById('challengeFeedback');
  const lights = document.querySelectorAll('#trafficLight .light');
  const completionMsg = document.getElementById('completionMessage');

  if (evalBtn) {
    evalBtn.addEventListener('click', async () => {
      const promptText = studentPrompt.value.trim();
      if (!promptText) {
        feedback5.textContent = 'Escribe tu prompt antes de evaluar.';
        return;
      }
      evalBtn.disabled = true;
      evalBtn.textContent = 'Evaluando...';
      feedback5.textContent = '';
      // Reset traffic lights
      lights.forEach(light => light.classList.remove('active'));
      completionMsg.classList.remove('visible');

      try {
        const res = await fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentPrompt: promptText })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Mostrar feedback
        feedback5.innerHTML = data.suggestions;
        // Encender semáforo según resultado
        if (data.ok) {
          lights[2].classList.add('active'); // verde
          completionMsg.classList.add('visible');
        } else if (data.score >= 50) {
          lights[1].classList.add('active'); // amarillo
        } else {
          lights[0].classList.add('active'); // rojo
        }
      } catch (err) {
        feedback5.textContent = `Error al evaluar: ${err.message}`;
      } finally {
        evalBtn.disabled = false;
        evalBtn.textContent = 'Evaluar Mi Prompt';
      }
    });
  }
});
