document.addEventListener('DOMContentLoaded', () => {


    // =================================================================================================//

    // --- New Image Copy Logic ---
async function copyImageToClipboard(imageSrc, buttonElement) {
    try {
        const response = await fetch(imageSrc);
        if (!response.ok) {
            throw new Error(`Error al cargar la imagen: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();

        if (!navigator.clipboard || !navigator.clipboard.write) {
            console.error('La API del portapapeles (navigator.clipboard.write) no es compatible o no está disponible en este contexto (ej. HTTP).');
            alert('Error al copiar: Funcionalidad no compatible o contexto inseguro (se requiere HTTPS).');
            return;
        }
        if (!window.ClipboardItem) {
            console.error('ClipboardItem no es compatible.');
            alert('Error al copiar: ClipboardItem no compatible.');
            return;
        }


        // Asegurarse de que el tipo MIME sea uno común si es un blob genérico
        let finalBlobType = blob.type;
        if (!finalBlobType || finalBlobType === "application/octet-stream") {
            // Intentar deducir por la extensión del archivo si es posible, o usar un tipo común
            const extension = imageSrc.split('.').pop().toLowerCase();
            if (extension === 'png') finalBlobType = 'image/png';
            else if (extension === 'jpg' || extension === 'jpeg') finalBlobType = 'image/jpeg';
            else if (extension === 'gif') finalBlobType = 'image/gif';
            else if (extension === 'webp') finalBlobType = 'image/webp';
            else { // Si no se puede deducir y el blob.type es genérico, puede fallar en algunos navegadores
                console.warn(`Tipo de blob desconocido o genérico: ${blob.type}. Intentando con image/png por defecto.`);
                finalBlobType = 'image/png'; // Opcional: o simplemente dejar que falle si el tipo no es bueno
            }
        }


        await navigator.clipboard.write([
            new ClipboardItem({
                [finalBlobType]: blob // Usar el tipo de blob real o deducido
            })
        ]);

        console.log('Imagen copiada al portapapeles');
        const originalText = buttonElement.textContent;
        buttonElement.textContent = '¡Imagen copiada!';
        setTimeout(() => {
            buttonElement.textContent = originalText;
        }, 2000);

    } catch (err) {
        console.error('Error al copiar la imagen: ', err);
        let userMessage = 'Error al copiar la imagen.';
        if (err.name === 'NotAllowedError') {
            userMessage = 'Permiso para escribir en el portapapeles denegado.';
        } else if (err.message.includes("must be handling a user gesture")) {
            userMessage = 'La copia debe ser iniciada por una acción del usuario (clic).';
        } else if (err.message.toLowerCase().includes("https") || err.message.toLowerCase().includes("secure context")) {
             userMessage = 'La copia de imágenes al portapapeles requiere un contexto seguro (HTTPS) o localhost.';
        }
        alert(userMessage + ' Revisa la consola para más detalles.');
    }
}

document.querySelectorAll('.copy-image-btn').forEach(button => {
    button.addEventListener('click', () => {
        const imageSrcToCopy = button.dataset.imageSrc;
        if (imageSrcToCopy) {
            copyImageToClipboard(imageSrcToCopy, button);
        } else {
            console.error('No se especificó la fuente de la imagen para el botón de copiar.');
            alert('Error: No se encontró la imagen a copiar.');
        }
    });
});
// --- End New Image Copy Logic ---

    // =================================================================================================//


    // --- Reusable Copy Button Logic (from Session 2) ---
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const textToCopy = document.getElementById(targetId).textContent;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    console.log('Text copied to clipboard');
                    const originalText = button.textContent;
                    button.textContent = '¡Copiado!';
                    setTimeout(() => {
                        button.textContent = originalText;
                    }, 2000);
                }).catch(err => {
                    console.error('Could not copy text: ', err);
                    fallbackCopyTextToClipboard(textToCopy);
                });
            } else {
                 fallbackCopyTextToClipboard(textToCopy);
            }
        });
    });

     function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            console.log('Fallback: ¡Copiado!');
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
             alert('Error al copiar. Por favor, selecciona el texto manualmente y cópialo.');
        }
        document.body.removeChild(textArea);
    }
    // --- End Reusable Copy Button Logic ---


    // --- Logic for displaying selected file names (New for Ejercicio 3) ---
    document.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', function() {
            const fileNameSpan = document.getElementById(this.id + '_name');
            if (this.files && this.files.length > 0) {
                fileNameSpan.textContent = `Archivo: ${this.files[0].name}`;
            } else {
                fileNameSpan.textContent = '';
            }
        });
    });


    // --- Main Evaluation Logic ---
    document.querySelectorAll('.evaluate-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const exerciseNum = button.dataset.exercise;
            const responseElementId = `ej${exerciseNum}_ai_response`;
            const responseElement = document.getElementById(responseElementId);

            // Clear previous response and show loading state
            responseElement.textContent = 'Evaluando...';
            responseElement.className = 'ai-response loading'; // Reset classes, add loading
            button.disabled = true; // Disable button while loading

            let endpoint = '';
            let payload = null;
            let error = null;

            // --- Prepare payload based on exercise ---
            if (exerciseNum === '1') { // Sora (Link)
                endpoint = '/api/evaluate/exercise1'; // Example endpoint
                const linkInput = document.getElementById('ej1_link_input');
                const link = linkInput.value.trim();
                if (!link) {
                    error = 'Por favor, pega el enlace de tu infografía.';
                } else {
                    payload = { link: link };
                }

            } else if (exerciseNum === '2') { // Notebook LM (Link)
                endpoint = '/api/evaluate/exercise2'; // Example endpoint
                const linkInput = document.getElementById('ej2_link_input');
                const link = linkInput.value.trim();
                 if (!link) {
                    error = 'Por favor, pega el enlace de tu notebook.';
                } else {
                    payload = { link: link };
                }

            } else if (exerciseNum === '3') { // Google AI Studio + Word (Files + Text)
                endpoint = '/api/evaluate/exercise3'; // Example endpoint
                const promptInput = document.getElementById('ej3_prompt_input');
                const fileBeforeInput = document.getElementById('ej3_file_before');
                const fileAfterInput = document.getElementById('ej3_file_after');

                const promptText = promptInput.value.trim();
                const fileBefore = fileBeforeInput.files[0];
                const fileAfter = fileAfterInput.files[0];

                if (!promptText || !fileBefore || !fileAfter) {
                    error = 'Por favor, ingresa el prompt y sube ambas capturas (Antes y Después).';
                } else {
                    // Use FormData to send files and text together
                    payload = new FormData();
                    payload.append('prompt', promptText);
                    payload.append('fileBefore', fileBefore);
                    payload.append('fileAfter', fileAfter);
                    // Note: When using FormData, fetch does NOT require setting the 'Content-Type' header.
                    // The browser sets it automatically, including the boundary needed for multipart/form-data.
                }

            } else {
                error = 'Ejercicio desconocido.';
            }

            // --- Handle immediate errors or proceed with fetch ---
            if (error) {
                responseElement.textContent = `Error de validación: ${error}`;
                responseElement.className = 'ai-response error';
                button.disabled = false; // Re-enable button
                return; // Stop here
            }

            // --- Send request to backend ---
            try {
                 // --- IMPORTANT ---
                 // These endpoints are placeholders. Your backend (consulta.js) needs to:
                 // 1. Implement handlers for /api/evaluate/exercise1, /api/evaluate/exercise2, /api/evaluate/exercise3.
                 // 2. For exercise 1 & 2, read the link from req.body.link.
                 // 3. For exercise 3, read the prompt text from req.body.prompt and the files from req.files or similar (depends on your Node.js file upload middleware, e.g., Multer).
                 // 4. Implement the evaluation logic based on the criteria described in the HTML for that exercise.
                 // 5. Send a response back to the frontend, preferably JSON like { status: "success" | "needs_work" | "error", feedback: "Specific message here" }.
                 // --- -------------

                let fetchOptions = {
                    method: 'POST',
                };

                if (payload instanceof FormData) {
                     // For file uploads, just set the body
                     fetchOptions.body = payload;
                     // Do NOT set Content-Type: 'multipart/form-data'; browser does it.
                } else {
                    // For JSON payloads (text/link)
                    fetchOptions.headers = {
                        'Content-Type': 'application/json',
                    };
                    fetchOptions.body = JSON.stringify(payload);
                }


                const response = await fetch(endpoint, fetchOptions);

                if (!response.ok) {
                    const errorBody = await response.text(); // Get error text from backend
                    throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
                }

                const data = await response.json(); // Assuming backend sends JSON feedback

                // Display the evaluation result
                if (data && data.feedback) {
                    responseElement.textContent = `Resultado: ${data.status || ''} \nFeedback: ${data.feedback}`;
                    // Optionally, change background/color based on status
                    if (data.status === 'Aprobado' || data.status === 'Corrección aplicada correctamente') {
                         responseElement.className = 'ai-response success'; // Add a success class for styling
                    } else if (data.status === 'Ajustes menores' || data.status === 'Rehacer') {
                         responseElement.className = 'ai-response warning'; // Add a warning class
                    } else {
                         responseElement.className = 'ai-response'; // Default state
                    }

                } else {
                    throw new Error('Formato de respuesta inesperado del backend.');
                }

            } catch (err) {
                console.error(`Error evaluating exercise ${exerciseNum}:`, err);
                responseElement.textContent = `Error en la evaluación: ${err.message || 'Error desconocido'}`;
                responseElement.className = 'ai-response error'; // Set error class
            } finally {
                button.disabled = false; // Re-enable button
            }
        });
    });

});