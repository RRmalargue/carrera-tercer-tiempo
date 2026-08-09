document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let currentStep = 1;
    let config = null;
    let uploadedFileBase64 = null;
    let uploadedFileName = null;
    let uploadedFileType = null;

    // IMPORTANT: Reemplazar esta URL con el Web App URL provisto por Google Apps Script al publicar el script.
    // Si la URL contiene 'TU_SCRIPT_URL_AQUI', el sistema funcionará en MODO DEMOSTRACIÓN (simulación).
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_ey1wwIBjzMzbOmqURIgFgkfVCtX3PvRgVpxZbPv7xtNlLlKF4OoCXKTU8hvkMsLX/exec';

    // HTML Elements
    const form = document.getElementById('registration-form');
    const bgOverlay = document.getElementById('bg-overlay');
    const raceTitle = document.getElementById('race-title');
    const footerRaceName = document.getElementById('footer-race-name');
    const tshirtImage = document.getElementById('tshirt-image');
    const altimetryImage = document.getElementById('altimetry-image');
    const paymentDetailsText = document.getElementById('payment-details-text');
    const deslindeDownload = document.getElementById('deslinde-download');
    const gpxBtn = document.getElementById('gpx-btn');
    const kmlBtn = document.getElementById('kml-btn');
    const startLocationBtn = document.getElementById('start-location-btn');
    const distancesContainer = document.getElementById('distances-container');

    // Leaflet.js variables for interactive GPX maps
    let trackMap = null;
    let trackPolyline = null;

    // Steps & Indicators
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const indicator1 = document.getElementById('indicator-1');
    const indicator2 = document.getElementById('indicator-2');

    // Navigation Buttons
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('btn-submit');
    const errorBar = document.getElementById('error-bar');
    const errorText = document.getElementById('error-text');

    // Step 1 Inputs
    const inputNombre = document.getElementById('nombre');
    const inputApellido = document.getElementById('apellido');
    const inputCuil = document.getElementById('cuil');
    const inputFechaNacimiento = document.getElementById('fecha_nacimiento');
    const inputGenero = document.getElementById('genero');
    const inputEdad = document.getElementById('edad');
    const inputCategoria = document.getElementById('categoria');
    const inputTelefono = document.getElementById('telefono');
    const inputTalleRemera = document.getElementById('talle_remera');

    // Step 3 Inputs / Info
    const fileDropzone = document.getElementById('file-dropzone');
    const fileInput = document.getElementById('comprobante');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const previewFilename = document.getElementById('preview-filename');
    const previewFilesize = document.getElementById('preview-filesize');
    const previewIcon = document.getElementById('preview-icon');
    const btnRemoveFile = document.getElementById('btn-remove-file');
    const acceptTerms = document.getElementById('accept-terms');

    // Summary Elements
    const summaryCorredor = document.getElementById('summary-corredor');
    const summaryDistancia = document.getElementById('summary-distancia');
    const summaryCategoria = document.getElementById('summary-categoria');
    const summaryMonto = document.getElementById('summary-monto');

    // Screens
    const successScreen = document.getElementById('success-screen');
    const loadingScreen = document.getElementById('loading-screen');

    // Configuración de respaldo (Fallback) en caso de que el navegador bloquee la carga local (restricciones CORS al abrir con doble clic en archivo local)
    const FALLBACK_CONFIG = {
      "raceName": "CROSS TRAIL \"TERCER TIEMPO\"",
      "posterImage": "./IMAGENES/AFICHE TERCER.jpg",
      "tshirtImage": "./IMAGENES/REMERA TERCER.jpg",
      "altitudeMapImage": "./IMAGENES/MAPA ALTURA.jpg",
      "gpxLink": "#",
      "kmlLink": "#",
      "startLocationMapLink": "https://maps.google.com/?q=-34.603722,-58.381592",
      "deslindeLink": "./assets/deslinde.pdf",
      "paymentDetails": "Banco de la Nación Argentina\nCBU: 0110599520000001234567\nAlias: ALPACHIRI.TRAIL\nTitular: Trail Running S.A.",
      "distances": [
        {
          "id": "5 KMS",
          "name": "COMPETITIVA",
          "price": 35000,
          "detail": ""
        },
        {
          "id": "15 KMS",
          "name": "COMPETITIVA",
          "price": 50000,
          "detail": ""
        }
      ],
      "categories": [
        { "id": "infantiles_4_y_5_años", "name": "INFANTILES 4 Y 5 AÑOS 100 MTS", "minAge": 4, "maxAge": 5 },
        { "id": "infantiles_6_y_7_años", "name": "INFANTILES 6 Y 7 AÑOS 200 MTS", "minAge": 6, "maxAge": 7 },
        { "id": "infantiles_8_y_9_años", "name": "INFANTILES 8 Y 9 AÑOS 400 MTS", "minAge": 8, "maxAge": 9 },
        { "id": "infantiles_10_y_11_años", "name": "INFANTILES 10 Y 11 AÑOS 800 MTS", "minAge": 10, "maxAge": 11 },
        { "id": "infantiles_12_y_13_años", "name": "INFANTILES 12 Y 13 AÑOS 1200 MTS", "minAge": 12, "maxAge": 13 },
        { "id": "damas_5_kms", "name": "DAMAS 5 KMS LIBRE", "minAge": 13, "maxAge": 80 },
        { "id": "caballeros_5_kms_libre", "name": "CABALLEROS 5 KMS LIBRE", "minAge": 13, "maxAge": 80 },
        { "id": "damas_15_kms_16_a_19_años", "name": "DAMAS 15 KMS 16  A 19 AÑOS", "minAge": 16, "maxAge": 19 },
        { "id": "damas_15_kms_20_a_29_años", "name": "DAMAS 15 KMS 20 A 29 AÑOS", "minAge": 20, "maxAge": 29 },
        { "id": "damas_15_kms_30_a_39_años", "name": "DAMAS 15 KMS 30 A 39 AÑOS", "minAge": 30, "maxAge": 39 },
        { "id": "damas_15_kms_40_a_49_años", "name": "DAMAS 15 KMS 40 A 49 AÑOS", "minAge": 40, "maxAge": 49 },
        { "id": "damas_15_kms_50_a_59_años", "name": "DAMAS 15 KMS 50 A 59 AÑOS", "minAge": 50, "maxAge": 59 },
        { "id": "damas_15_kms_60_a_69_años", "name": "DAMAS 15 KMS 60 A 69 AÑOS", "minAge": 60, "maxAge": 69 },
        { "id": "15_kms_caballeros_16_a_19_años", "name": "15 KMS CABALLEROS 16 A 19 AÑOS", "minAge": 16, "maxAge": 19 },
        { "id": "15_kms_caballeros_20_a_29_años", "name": "15 KMS CABALLEROS 20 A 29 AÑOS", "minAge": 20, "maxAge": 29 },
        { "id": "15_kms_caballeros_30_a_39_años", "name": "15 KMS CABALLEROS 30 A 39 AÑOS", "minAge": 30, "maxAge": 39 },
        { "id": "15_kms_caballeros_40_a_49_años", "name": "15 KMS CABALLEROS 40 A 49 AÑOS", "minAge": 40, "maxAge": 49 },
        { "id": "15_kms_caballeros_50_a_59_años", "name": "15 KMS CABALLEROS 50 A 59 AÑOS", "minAge": 50, "maxAge": 59 },
        { "id": "15_kms_caballeros_60_a_69_años", "name": "15 KMS CABALLEROS 60 A 69 AÑOS", "minAge": 60, "maxAge": 69 }
      ]
    };

    // 1. CARGA DE CONFIGURACIÓN DINÁMICA
    async function loadConfig() {
        if (typeof window.RACE_CONFIG !== 'undefined' && window.RACE_CONFIG) {
            console.log('Cargada configuración dinámica local desde config.js');
            config = window.RACE_CONFIG;
            renderRaceDetails();
        } else {
            // Intentar fetch config.json por compatibilidad hacia atrás
            try {
                const response = await fetch('./config.json');
                config = await response.json();
                console.log('Cargada configuración dinámica desde config.json');
                renderRaceDetails();
            } catch (error) {
                console.warn('Advertencia: No se detectó config.js ni se pudo cargar config.json. Usando configuración de respaldo integrada.');
                config = FALLBACK_CONFIG;
                renderRaceDetails();
            }
        }
    }

    function renderRaceDetails() {
        if (!config) return;

        // Configuración de la interfaz
        raceTitle.textContent = config.raceName || 'CARRERA DE TRAIL';
        footerRaceName.textContent = config.raceName || 'Trail Running Portal';
        
        // Carga de imágenes
        if (config.posterImage) {
            bgOverlay.style.backgroundImage = `url('${config.posterImage}')`;
            
            // Cargar afiche principal visible
            const posterBanner = document.getElementById('poster-banner');
            const posterBannerContainer = document.getElementById('poster-banner-container');
            if (posterBanner && posterBannerContainer) {
                posterBanner.src = config.posterImage;
                posterBannerContainer.classList.remove('hidden');
            }
        } else {
            const posterBannerContainer = document.getElementById('poster-banner-container');
            if (posterBannerContainer) {
                posterBannerContainer.classList.add('hidden');
            }
        }
        
        if (config.tshirtImage) {
            tshirtImage.src = config.tshirtImage;
            document.getElementById('tshirt-preview-card').classList.remove('hidden');
        } else {
            document.getElementById('tshirt-preview-card').classList.add('hidden');
        }

        if (config.altitudeMapImage) {
            altimetryImage.src = config.altitudeMapImage;
            document.getElementById('altimetry-card').classList.remove('hidden');
        } else {
            document.getElementById('altimetry-card').classList.add('hidden');
        }

        // Datos de pago
        paymentDetailsText.textContent = config.paymentDetails || 'No se han configurado los detalles de pago.';

        // Links de descargas y mapas
        deslindeDownload.href = config.deslindeLink || '#';
        
        if (config.gpxLink && config.gpxLink !== '#') {
            gpxBtn.href = config.gpxLink;
            gpxBtn.classList.remove('hidden');
        } else {
            gpxBtn.classList.add('hidden');
        }

        if (config.kmlLink && config.kmlLink !== '#') {
            kmlBtn.href = config.kmlLink;
            kmlBtn.classList.remove('hidden');
        } else {
            kmlBtn.classList.add('hidden');
        }

        if (config.startLocationMapLink && config.startLocationMapLink !== '#') {
            startLocationBtn.href = config.startLocationMapLink;
            startLocationBtn.classList.remove('hidden');
        } else {
            startLocationBtn.classList.add('hidden');
        }

        // Renderizado de tarjetas de distancia
        distancesContainer.innerHTML = '';
        if (config.distances && config.distances.length > 0) {
            config.distances.forEach(dist => {
                const card = document.createElement('div');
                card.className = 'selector-card';
                card.dataset.id = dist.id;
                card.dataset.price = dist.price;
                card.dataset.name = dist.name;

                card.innerHTML = `
                    <div class="card-title">${dist.id}</div>
                    <div class="card-subtitle">${dist.name}</div>
                    <div class="card-detail">${dist.detail || ''}</div>
                    <div class="card-price">$${dist.price.toLocaleString('es-AR')}</div>
                `;

                card.addEventListener('click', () => selectDistance(card));
                distancesContainer.appendChild(card);
            });
        }

        // Cargar mapa interactivo GPX
        loadGpxMap();
    }

    // 2. SELECCIÓN DE DISTANCIA
    function selectDistance(cardElement) {
        document.querySelectorAll('.selector-card').forEach(card => {
            card.classList.remove('selected');
        });
        cardElement.classList.add('selected');

        document.getElementById('selected-distance-id').value = cardElement.dataset.id;
        document.getElementById('selected-distance-price').value = cardElement.dataset.price;
        
        // Recalcular categoría ya que la distancia seleccionada influye en la categoría
        recalculateCategory();
        
        hideError();

        // Cargar mapa dinámico del track correspondiente a esta distancia
        loadGpxMap();
    }

    // 3. VALIDACIÓN DE CUIL (11 dígitos, solo números)
    inputCuil.addEventListener('input', (e) => {
        // Remover cualquier caracter no numérico
        let cleanValue = e.target.value.replace(/\D/g, '');
        e.target.value = cleanValue; // Limitar entrada a números únicamente
    });

    // 4. CÁLCULO DE EDAD Y CATEGORÍA
    function recalculateCategory() {
        const birthDateVal = inputFechaNacimiento.value;
        const genderVal = inputGenero.value;
        const distanceVal = document.getElementById('selected-distance-id').value;

        if (!birthDateVal) return;

        const age = calculateAge(birthDateVal);
        inputEdad.value = `${age} años`;

        const categoryName = determineCategory(age, genderVal, distanceVal);
        inputCategoria.value = categoryName;
    }

    inputFechaNacimiento.addEventListener('change', recalculateCategory);
    inputGenero.addEventListener('change', recalculateCategory);

    function calculateAge(birthDateString) {
        const today = new Date();
        const birthDate = new Date(birthDateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    function determineCategory(age, gender, distance) {
        if (!config || !config.categories || config.categories.length === 0) {
            return 'General';
        }
        
        // 1. Filtrar por rango de edad (filtro primario)
        let candidates = config.categories.filter(cat => age >= cat.minAge && age <= cat.maxAge);
        if (candidates.length === 0) {
            return 'Sin categoría asignada (Fuera de rango)';
        }
        
        const genderClean = (gender || '').toLowerCase();
        const distClean = (distance || '').toLowerCase().replace(/\s+/g, ''); // "5kms" o "15kms"
        
        // 2. Filtrar por género (si la categoría discrimina por género)
        if (genderClean.includes('fem') || genderClean.includes('dam')) {
            // Eliminar categorías masculinas
            candidates = candidates.filter(cat => {
                const name = cat.name.toLowerCase();
                const id = cat.id.toLowerCase();
                return !(name.includes('caballeros') || name.includes('masculino') || id.includes('caballeros') || id.includes('masculino') || id.startsWith('m_'));
            });
        } else if (genderClean.includes('masc') || genderClean.includes('cab')) {
            // Eliminar categorías femeninas
            candidates = candidates.filter(cat => {
                const name = cat.name.toLowerCase();
                const id = cat.id.toLowerCase();
                return !(name.includes('damas') || name.includes('femenino') || id.includes('damas') || id.includes('femenino') || id.startsWith('f_'));
            });
        }
        
        // Expresiones regulares con límites de palabras (\b) para evitar colisiones de subcadena (evita que "15 kms" contenga "5 km")
        const matches5k = /\b5\s*k/i;
        const matches15k = /\b15\s*k/i;

        // 3. Filtrar por distancia (si la distancia ya fue seleccionada)
        if (distClean) {
            if (distClean.includes('15')) {
                // Eliminar categorías de 5K e Infantiles si no aplica
                candidates = candidates.filter(cat => {
                    const name = cat.name.toLowerCase();
                    const id = cat.id.toLowerCase();
                    return !(matches5k.test(name) || matches5k.test(id) || id.includes('_5k') || id.includes('_5_km') || name.includes('infantil') || id.includes('infantil'));
                });
            } else if (distClean.includes('5') && !distClean.includes('15')) {
                // Para 5K, si existen categorías específicas que mencionan 5K, usar ÚNICAMENTE esas
                const hasSpecific5k = candidates.some(cat => {
                    const name = cat.name.toLowerCase();
                    const id = cat.id.toLowerCase();
                    return (matches5k.test(name) || matches5k.test(id) || id.includes('_5k') || id.includes('_5_km'));
                });
                
                if (hasSpecific5k) {
                    candidates = candidates.filter(cat => {
                        const name = cat.name.toLowerCase();
                        const id = cat.id.toLowerCase();
                        return (matches5k.test(name) || matches5k.test(id) || id.includes('_5k') || id.includes('_5_km'));
                    });
                }
            } else if (distClean.includes('infantil')) {
                // Para infantiles, usar ÚNICAMENTE las categorías que digan infantil
                candidates = candidates.filter(cat => {
                    const name = cat.name.toLowerCase();
                    const id = cat.id.toLowerCase();
                    return (name.includes('infantil') || id.includes('infantil'));
                });
            }
        } else {
            // Si no se seleccionó distancia aún, ver si quedan categorías de distintas distancias
            const has5k = candidates.some(cat => matches5k.test(cat.name.toLowerCase()) || matches5k.test(cat.id.toLowerCase()));
            const has15k = candidates.some(cat => matches15k.test(cat.name.toLowerCase()) || matches15k.test(cat.id.toLowerCase()));
            
            if (has5k && has15k) {
                return 'Se definirá al seleccionar la distancia';
            }
        }
        
        // Retornar el primer candidato que coincida
        if (candidates.length > 0) {
            return candidates[0].name;
        }
        
        return 'Sin categoría asignada';
    }

    // 5. NAVEGACIÓN Y WIZARD FORM
    btnNext.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            goToStep(currentStep + 1);
        }
    });

    btnPrev.addEventListener('click', () => {
        goToStep(currentStep - 1);
    });

    function goToStep(step) {
        hideError();

        // Guardar valores del paso actual y actualizar el resumen cuando se pasa al Paso 2
        if (step === 2) {
            updateSummary();
        }

        // Ocultar todos los pasos
        step1.classList.add('hidden');
        step2.classList.add('hidden');

        // Quitar estado activo de indicadores
        indicator1.classList.remove('active');
        indicator2.classList.remove('active');
        indicator1.classList.remove('completed');
        indicator2.classList.remove('completed');

        // Activar el paso correspondiente
        if (step === 1) {
            step1.classList.remove('hidden');
            indicator1.classList.add('active');
            btnPrev.disabled = true;
            btnNext.classList.remove('hidden');
            btnSubmit.classList.add('hidden');
        } else if (step === 2) {
            step1.classList.add('completed');
            step2.classList.remove('hidden');
            indicator2.classList.add('active');
            indicator1.classList.add('completed');
            btnPrev.disabled = false;
            btnNext.classList.add('hidden');
            btnSubmit.classList.remove('hidden');
        }

        currentStep = step;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 6. VALIDACIONES POR PASO
    function validateStep(step) {
        if (step === 1) {
            // Forzar recálculo por seguridad
            recalculateCategory();

            let firstInvalidEl = null;

            function checkField(element, condition, errorMsg) {
                if (condition) {
                    element.classList.add('invalid-field');
                    element.classList.remove('completed-field');
                    if (!firstInvalidEl) firstInvalidEl = element;
                    return errorMsg;
                } else {
                    element.classList.remove('invalid-field');
                    element.classList.add('completed-field');
                    return null;
                }
            }

            let error = null;
            
            error = error || checkField(inputNombre, !inputNombre.value.trim(), 'El nombre es obligatorio.');
            error = error || checkField(inputApellido, !inputApellido.value.trim(), 'El apellido es obligatorio.');
            
            const cuilVal = inputCuil.value.trim();
            error = error || checkField(inputCuil, !cuilVal || cuilVal.length !== 11, 'El CUIL debe tener exactamente 11 números.');
            
            error = error || checkField(inputFechaNacimiento, !inputFechaNacimiento.value, 'La fecha de nacimiento es obligatoria.');
            error = error || checkField(inputGenero, !inputGenero.value, 'Debes seleccionar tu género.');
            
            const ageVal = parseInt(inputEdad.value);
            error = error || checkField(inputFechaNacimiento, isNaN(ageVal) || ageVal < 4, isNaN(ageVal) ? 'Fecha de nacimiento inválida.' : 'La edad mínima para participar es de 4 años.');

            error = error || checkField(inputTelefono, !inputTelefono.value.trim(), 'El teléfono es obligatorio.');
            error = error || checkField(inputTalleRemera, !inputTalleRemera.value, 'Debes seleccionar el talle de remera.');

            // Validar la distancia seleccionada
            const distance = document.getElementById('selected-distance-id').value;
            const distancesContainer = document.getElementById('distances-container');
            error = error || checkField(distancesContainer, !distance, 'Debes seleccionar una distancia para correr.');
            
            // Validar que la categoría asignada sea válida
            const catVal = inputCategoria.value;
            error = error || checkField(inputCategoria, !catVal || catVal === 'Sin categoría asignada' || catVal === 'Se definirá al seleccionar la distancia' || catVal.includes('Fuera de rango'), 'No se encontró una categoría válida para tu edad, género y distancia seleccionada.');

            if (error) {
                if (firstInvalidEl) {
                    firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalidEl.focus();
                }
                return showError(error);
            }
            
            return true;
        }

        return true;
    }

    function updateSummary() {
        const cost = parseFloat(document.getElementById('selected-distance-price').value) || 0;
        summaryCorredor.textContent = `${inputNombre.value} ${inputApellido.value}`;
        summaryDistancia.textContent = document.getElementById('selected-distance-id').value;
        summaryCategoria.textContent = inputCategoria.value || 'General';
        summaryMonto.textContent = `$${cost.toLocaleString('es-AR')}`;
    }

    // 7. CARGA DE ARCHIVO Y PREVIEW
    // Drag & Drop
    ['dragenter', 'dragover'].forEach(eventName => {
        fileDropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            fileDropzone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        fileDropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            fileDropzone.classList.remove('dragover');
        }, false);
    });

    fileDropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Triggers input click on box click
    fileDropzone.addEventListener('click', (e) => {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });

    async function handleFile(file) {
        hideError();
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

        if (!allowedTypes.includes(file.type)) {
            showError('Formato no permitido. Solo se aceptan imágenes (JPG, PNG) o PDF.');
            resetFileInput();
            return;
        }

        if (file.size > maxSize) {
            showError('El archivo es demasiado grande. El límite es 5MB.');
            resetFileInput();
            return;
        }

        uploadedFileName = file.name;
        uploadedFileType = file.type;

        // Visual change
        previewFilename.textContent = file.name;
        previewFilesize.textContent = formatBytes(file.size);
        
        // Icon type
        if (file.type === 'application/pdf') {
            previewIcon.className = 'fa-solid fa-file-pdf file-preview-icon';
            previewIcon.style.color = '#ff5252';
        } else {
            previewIcon.className = 'fa-solid fa-file-image file-preview-icon';
            previewIcon.style.color = '#00f2fe';
        }

        // Base64 conversion
        try {
            uploadedFileBase64 = await toBase64(file);
            fileDropzone.classList.add('hidden');
            filePreviewContainer.classList.remove('hidden');
            validateSubmitButton();
        } catch (err) {
            console.error('Error convirtiendo archivo:', err);
            showError('Ocurrió un error al procesar el archivo. Reinténtalo.');
            resetFileInput();
        }
    }

    btnRemoveFile.addEventListener('click', (e) => {
        e.stopPropagation();
        resetFileInput();
        hideError();
    });

    function resetFileInput() {
        fileInput.value = '';
        uploadedFileBase64 = null;
        uploadedFileName = null;
        uploadedFileType = null;
        fileDropzone.classList.remove('hidden');
        filePreviewContainer.classList.add('hidden');
        validateSubmitButton();
    }

    // Helper functions
    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Return only base64 data string without schema prefix
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
        });
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Accept Terms & Validate Submit
    acceptTerms.addEventListener('change', () => {
        validateSubmitButton();
        if (acceptTerms.checked) {
            document.getElementById('terms-container').classList.remove('error-glow');
        }
    });

    function validateSubmitButton() {
        if (uploadedFileBase64 && acceptTerms.checked) {
            btnSubmit.disabled = false;
        } else {
            btnSubmit.disabled = true;
        }
    }

    // 8. ENVÍO DE DATOS
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        if (!uploadedFileBase64) {
            return showError('El comprobante de pago es un archivo obligatorio.');
        }

        const termsContainer = document.getElementById('terms-container');
        if (!acceptTerms.checked) {
            termsContainer.classList.add('error-glow');
            setTimeout(() => {
                termsContainer.classList.remove('error-glow');
            }, 500);
            return showError('Debes aceptar los términos y el deslinde de responsabilidad.');
        } else {
            termsContainer.classList.remove('error-glow');
        }

        // Show loading screen
        document.querySelector('.card-wrapper').style.minHeight = '300px';
        form.classList.add('hidden');
        loadingScreen.classList.remove('hidden');

        // Compile payload
        const formData = {
            nombre: inputNombre.value.trim(),
            apellido: inputApellido.value.trim(),
            cuil: inputCuil.value.trim(),
            fecha_nacimiento: inputFechaNacimiento.value,
            edad: inputEdad.value.replace(' años', ''),
            categoria: inputCategoria.value,
            telefono: inputTelefono.value.trim(),
            talle_remera: inputTalleRemera.value,
            distancia: document.getElementById('selected-distance-id').value,
            costo: document.getElementById('selected-distance-price').value,
            comprobante_base64: uploadedFileBase64,
            comprobante_nombre: uploadedFileName,
            comprobante_tipo: uploadedFileType,
            timestamp: new Date().toISOString()
        };

        // CHECK IF IN MOCK/DEMO MODE
        if (GOOGLE_SCRIPT_URL === 'TU_SCRIPT_URL_AQUI' || GOOGLE_SCRIPT_URL.trim() === '') {
            // Simulamos retraso de envío de red de 2 segundos en modo Demo
            console.log('--- MODO DEMOSTRACIÓN ---');
            console.log('Datos enviados:', formData);
            
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                successScreen.classList.remove('hidden');
            }, 2500);
            return;
        }

        // REAL HTTP POST SEND
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Evita bloqueos de CORS debido a redirecciones de Google
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(formData)
            });

            // En modo 'no-cors' la respuesta es opaca, por lo que asumimos éxito al no lanzar error de red
            loadingScreen.classList.add('hidden');
            successScreen.classList.remove('hidden');

        } catch (error) {
            console.error('Error al enviar registro:', error);
            // Revert screen state
            loadingScreen.classList.add('hidden');
            form.classList.remove('hidden');
            showError(`Error al procesar el envío: ${error.message || 'Problema de conexión'}. Revisa tu conexión o vuelve a intentarlo.`);
        }
    });

    // 9. ERROR HANDLING
    function showError(message) {
        errorText.textContent = message;
        errorBar.classList.remove('hidden');
        
        // Scroll to error
        errorBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }

    function hideError() {
        errorBar.classList.add('hidden');
    }

    // 10. RESALTADO DINÁMICO DE CAMPOS COMPLETADOS
    const fieldsToTrack = [
        inputNombre,
        inputApellido,
        inputCuil,
        inputFechaNacimiento,
        inputGenero,
        inputTelefono,
        inputTalleRemera
    ];

    function updateFieldHighlight(element) {
        if (!element) return;
        
        let isCompleted = false;
        
        if (element.tagName === 'SELECT') {
            isCompleted = element.value !== '';
        } else if (element.id === 'cuil') {
            isCompleted = element.value.trim().length === 11;
        } else if (element.type === 'date') {
            isCompleted = element.value !== '';
        } else {
            isCompleted = element.value.trim() !== '';
        }

        if (isCompleted) {
            element.classList.add('completed-field');
            element.classList.remove('invalid-field');
        } else {
            element.classList.remove('completed-field');
        }
    }

    fieldsToTrack.forEach(field => {
        if (!field) return;
        
        field.addEventListener('input', () => {
            updateFieldHighlight(field);
            hideError();
        });
        field.addEventListener('change', () => {
            updateFieldHighlight(field);
            hideError();
        });
        field.addEventListener('blur', () => {
            updateFieldHighlight(field);
        });
        
        // Ejecutar inicialmente por si hay autocompletado
        updateFieldHighlight(field);
    });

    // Escuchar selección de distancia
    document.addEventListener('click', (e) => {
        if (e.target.closest('.selector-card')) {
            const distancesContainer = document.getElementById('distances-container');
            distancesContainer.classList.remove('invalid-field');
            distancesContainer.classList.add('completed-field');
        }
    });

    async function loadGpxMap() {
        const mapContainer = document.getElementById('map-track');
        if (!mapContainer) return;

        // 1. Obtener la distancia seleccionada
        const selectedDistanceId = document.getElementById('selected-distance-id').value;
        let gpxLink = config.gpxLink; // Usar el global por defecto

        // 2. Si hay distancia seleccionada, buscar si tiene un GPX específico
        if (selectedDistanceId && config.distances) {
            const matchedDist = config.distances.find(d => d.id === selectedDistanceId);
            if (matchedDist && matchedDist.gpxLink && matchedDist.gpxLink.trim() !== '' && matchedDist.gpxLink !== '#') {
                gpxLink = matchedDist.gpxLink;
            }
        }

        // 3. Si no hay GPX (ni global ni por distancia), ocultamos el mapa
        if (!gpxLink || gpxLink === '#' || gpxLink.trim() === '') {
            document.getElementById('interactive-map-card').classList.add('hidden');
            return;
        }

        document.getElementById('interactive-map-card').classList.remove('hidden');

        try {
            // Cargar el archivo GPX
            const response = await fetch(gpxLink);
            if (!response.ok) throw new Error('No se pudo cargar el archivo GPX.');
            const gpxText = await response.text();

            // Parsear XML de GPX
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(gpxText, 'text/xml');
            const points = [];
            const trackPoints = xmlDoc.getElementsByTagName('trkpt');

            for (let i = 0; i < trackPoints.length; i++) {
                const lat = parseFloat(trackPoints[i].getAttribute('lat'));
                const lon = parseFloat(trackPoints[i].getAttribute('lon'));
                if (!isNaN(lat) && !isNaN(lon)) {
                    points.push([lat, lon]);
                }
            }

            if (points.length === 0) {
                console.warn('El archivo GPX no contiene puntos de track válidos.');
                document.getElementById('interactive-map-card').classList.add('hidden');
                return;
            }

            // Inicializar el mapa si no existe
            if (!trackMap) {
                const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© Colaboradores de OpenStreetMap'
                });

                const satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                });

                trackMap = L.map('map-track', {
                    scrollWheelZoom: false,
                    layers: [streetMap]
                });

                const baseMaps = {
                    "Mapa de Calles": streetMap,
                    "Vista Satélite": satelliteMap
                };

                L.control.layers(baseMaps).addTo(trackMap);

                // Alternar zoom con la rueda al hacer clic en el mapa
                trackMap.on('click', () => {
                    if (trackMap.scrollWheelZoom.enabled()) {
                        trackMap.scrollWheelZoom.disable();
                    } else {
                        trackMap.scrollWheelZoom.enable();
                    }
                });
            }

            // Remover dibujo previo si hay
            if (trackPolyline) {
                trackMap.removeLayer(trackPolyline);
            }

            // Dibujar la línea del track
            trackPolyline = L.polyline(points, {
                color: '#ff6b35', // Naranja
                weight: 5,
                opacity: 0.9
            }).addTo(trackMap);

            // Ajustar la vista de cámara al circuito completo
            trackMap.fitBounds(trackPolyline.getBounds());

            // Colocar marcador en la salida
            L.marker(points[0]).addTo(trackMap)
                .bindPopup(`<b>Largada / Llegada - ${selectedDistanceId || ''}</b>`)
                .openPopup();

        } catch (error) {
            console.error('Error al inicializar el mapa GPX:', error);
            mapContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 2rem; text-align: center; color: var(--text-secondary);">
                    <i class="fa-solid fa-circle-exclamation" style="font-size: 2.5rem; color: var(--accent-orange); margin-bottom: 1rem;"></i>
                    <p style="font-weight: 600;">No se pudo cargar el mapa interactivo directamente.</p>
                    <p style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--text-muted);">
                        Esto ocurre por seguridad del navegador al abrir archivos locales directamente. Para verlo interactivo, ingresa desde: <a href="http://localhost:3000/index.html" style="color: var(--accent-cyan); text-decoration: underline;">http://localhost:3000</a> o descarga la ruta usando el botón de arriba.
                    </p>
                </div>
            `;
        }
    }

    // INIT
    loadConfig();
});
