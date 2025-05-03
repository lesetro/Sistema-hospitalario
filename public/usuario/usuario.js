
     
// Variables globales
let currentImages = [];
let textVariations = [];
let currentProduct = {
name: '',
price: '',
description: '',
images: [],
variations: []
};

// Sistema de pestañas
function openTab(tabId) {
document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

document.getElementById(tabId).classList.add('active');
const activeBtn = document.querySelector(`.tab-btn[onclick="openTab('${tabId}')"]`);
if (activeBtn) activeBtn.classList.add('active');

saveFormData();
}


// Función para guardar datos del formulario
function saveFormData() {
    currentProduct = {
        name: document.getElementById('productName').value,
        price: document.getElementById('productPrice').value,
        description: document.getElementById('productDescription').value,
        images: currentImages,
        variations: textVariations
    };
    console.log('Datos guardados:', currentProduct);
}

// Manejo de imágenes (versión corregida)
document.getElementById('productImages').addEventListener('change', function(e) {
    const files = e.target.files;
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    
    // Verificar límite de imágenes (5)
    if (currentImages.length + files.length > 5) {
        alert('Máximo 5 imágenes permitidas en total');
        e.target.value = ''; // Limpiar el input
        return;
    }
    
    // Procesar cada imagen (versión unificada)
    Array.from(files).forEach(file => {
        if (!file.type.match('image.*')) return;
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Agregar la nueva imagen al array
            currentImages.push(e.target.result);
            
            // Crear contenedor de previsualización con botón de eliminar
            const imgContainer = document.createElement('div');
            imgContainer.style.position = 'relative';
            imgContainer.style.display = 'inline-block';
            imgContainer.style.margin = '5px';
            
            const imgElement = document.createElement('img');
            imgElement.src = e.target.result;
            imgElement.style.height = '100px';
            imgElement.style.width = 'auto';
            imgElement.style.maxWidth = '100%';
            imgElement.style.objectFit = 'cover';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '×';
            deleteBtn.style.cssText = 'position:absolute;top:5px;right:5px;background:red;color:white;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:16px;';
            deleteBtn.onclick = () => {
                imgContainer.remove();
                currentImages = currentImages.filter(img => img !== e.target.result);
                document.getElementById('productImages').value = ''; // Resetear input
            };
            
            imgContainer.appendChild(imgElement);
            imgContainer.appendChild(deleteBtn);
            preview.appendChild(imgContainer);
            
            // Actualizar datos del producto
            saveFormData();
        };
        
        reader.readAsDataURL(file);
    });
});


// Generación de variaciones de texto
async function generateVariations() {
const baseText = document.getElementById('productVariations').value;
if (!baseText || baseText.length < 20) {
 alert('Por favor ingresa un texto base más largo para generar variaciones');
 return;
}

const container = document.getElementById('variationsContainer');
container.innerHTML = '<p>Generando variaciones...</p>';

setTimeout(() => {
 textVariations = generateTextVariations(baseText);
 displayVariations(textVariations);
}, 1500);
}

function generateTextVariations(baseText) {
const synonyms = {
 "producto": ["artículo", "modelo", "ítem"],
 "venta": ["compra", "transacción"],
 "calidad": ["excelencia", "valor"],
 "precio": ["valor", "costo"],
 "oferta": ["promoción", "descuento"]
};

const variations = [];
const numVariations = Math.floor(Math.random() * 6) + 5; // 5-10 variaciones

for (let i = 0; i < numVariations; i++) {
 let variation = baseText;
 
 // Reemplazo de sinónimos
 for (const [word, options] of Object.entries(synonyms)) {
     if (variation.includes(word)) {
         variation = variation.replace(new RegExp(word, 'g'), options[Math.floor(Math.random() * options.length)]);
     }
 }
 
 // Modificadores aleatorios
 const modifiers = [
     txt => "🔥 " + txt,
     txt => txt + " ¡No te lo pierdas!",
     txt => txt.toUpperCase(),
     txt => "⭐ " + txt.substring(0, 1).toUpperCase() + txt.substring(1),
     txt => txt.replace(/\.$/, '') + "..."
 ];
 
 // Aplicar 1-2 modificadores
 const numModifiers = Math.floor(Math.random() * 2) + 1;
 for (let j = 0; j < numModifiers; j++) {
     variation = modifiers[Math.floor(Math.random() * modifiers.length)](variation);
 }
 
 variations.push(variation);
}

return variations;
}

function displayVariations(variations) {
const container = document.getElementById('variationsContainer');
container.innerHTML = '<h4>Variaciones generadas:</h4>';

variations.forEach((variation, index) => {
 const div = document.createElement('div');
 div.className = 'variation-item';
 div.innerHTML = `
     <p><strong>Versión ${index + 1}:</strong> ${variation}</p>
     <button type="button" class="btn" onclick="editVariation(${index})">Editar</button>
 `;
 container.appendChild(div);
});
}

function editVariation(index) {
const newText = prompt('Editar variación:', textVariations[index]);
if (newText !== null) {
 textVariations[index] = newText;
 displayVariations(textVariations);
}
}

// Configuración de planes
function updatePlanSettings() {
const plan = document.getElementById('plan').value;
document.getElementById('basicDetails').classList.toggle('hidden', plan !== 'basic');
document.getElementById('premiumDetails').classList.toggle('hidden', plan !== 'premium');
updateGroupInputs(plan === 'basic' ? 5 : 10);
}

function updateGroupInputs(maxGroups) {
const container = document.getElementById('groupUrlsContainer');
const inputs = container.querySelectorAll('.group-url');

if (inputs.length > maxGroups) {
 inputs.forEach((input, index) => index >= maxGroups && input.remove());
}

document.getElementById('addGroupBtn').style.display = 
 inputs.length >= maxGroups ? 'none' : 'block';
}

document.getElementById('addGroupBtn').addEventListener('click', function() {
const plan = document.getElementById('plan').value;
if (!plan) {
 alert('Por favor selecciona un plan primero');
 return;
}

const maxGroups = plan === 'basic' ? 5 : 10;
const container = document.getElementById('groupUrlsContainer');

if (container.querySelectorAll('.group-url').length < maxGroups) {
 const newInput = document.createElement('input');
 newInput.type = 'url';
 newInput.className = 'group-url';
 newInput.placeholder = `https://www.facebook.com/groups/tugrupo${container.querySelectorAll('.group-url').length + 1}`;
 newInput.required = true;
 container.appendChild(newInput);
 
 if (container.querySelectorAll('.group-url').length >= maxGroups) {
     this.style.display = 'none';
 }
}
});

// Cambio de producto
function toggleProductChange() {
document.getElementById('newProductSection').classList.toggle('hidden', 
 document.getElementById('productChange').value !== 'yes');
}

// Validación del formulario
document.getElementById('botConfigForm').addEventListener('submit', function(e) {
e.preventDefault();

// Validaciones básicas
if (!validateForm()) return;

alert('Configuración guardada correctamente!');
submitForm();
});

function validateForm() {
if (!document.getElementById('plan').value) {
 alert('Por favor selecciona un plan');
 openTab('settings-tab');
 return false;
}

if (currentImages.length < 3) {
 alert('Debes subir al menos 3 imágenes del producto');
 openTab('product-tab');
 return false;
}

if (textVariations.length <5 ) { //tenia un 5
 alert('Debes generar al menos 5 variaciones de texto');
 openTab('product-tab');
 return false;
}

const groups = Array.from(document.querySelectorAll('.group-url'));
if (groups.some(input => !input.value.trim())) {
 alert('Por favor completa todas las URLs de grupos');
 openTab('settings-tab');
 return false;
}

const whatsapp = document.getElementById('userWhatsApp').value;
if (!whatsapp?.startsWith('+')) {
 alert('Ingresa un número de WhatsApp válido con código de país (ej: +5491122334455)');
 openTab('notifications-tab');
 return false;
}

return true;
}


async function submitForm() {
    // Función para convertir imágenes a Base64
   const getBase64Images = async (files) => {
    const fileArray = Array.from(files);
    
    const conversionPromises = fileArray.map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    });
    
    return Promise.all(conversionPromises);
};
    
    try {
        // Obtener imágenes (si hay un input de subida)
        const imageFiles = document.getElementById('image-upload')?.files;
        const images = imageFiles ? await getBase64Images(imageFiles) : currentProduct.images;

        // Preparar payload completo
        const payload = {
            name: currentProduct.name,
            price: currentProduct.price,
            description: currentProduct.description,
            images: images,
            variations: currentProduct.variations,
            plan: document.getElementById('plan').value,
            groups: Array.from(document.querySelectorAll('.group-url'))
                .map(input => input.value.trim())
                .filter(Boolean),
            notifications: {
                email: document.getElementById('userEmail').value.trim(),
                whatsapp: document.getElementById('userWhatsApp').value.trim()
            }
        };

        console.log('Datos a enviar:', payload);

        // Mostrar estado de carga
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
        }

        // Enviar al backend
        const response = await fetch('http://localhost:5000/iniciar-bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al iniciar el bot');
        }

        console.log('Respuesta del backend:', data);
        alert(`✅ ¡Bot iniciado correctamente!\nProducto: ${payload.name}\nPID: ${data.pid}`);

    } catch (error) {
        console.error('Error en submitForm:', error);
        alert(`❌ Error: ${error.message}`);
    } finally {
        // Restaurar botón
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar';
        }
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
updatePlanSettings();
});
let selectedPlan = null;

// Selección de plan
document.querySelectorAll('.plan-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        selectedPlan = {
            amount: this.getAttribute('data-amount'),
            alias: this.getAttribute('data-alias')
        };
        
        // Mostrar instrucciones
        document.getElementById('payment-instructions').style.display = 'block';
        document.getElementById('plan-amount').textContent = selectedPlan.amount;
        document.getElementById('mercado-pago-alias').textContent = selectedPlan.alias;
        document.getElementById('metamask-info').style.display = 'block';
        document.getElementById('usdt-amount').textContent = selectedPlan.amount;
    });
});

// Subida de comprobante
document.getElementById('payment-proof').addEventListener('change', function(e) {
    document.getElementById('send-proof-btn').disabled = !e.target.files[0];
});

// Enviar comprobante al backend
document.getElementById('send-proof-btn').addEventListener('click', async function() {
    const file = document.getElementById('payment-proof').files[0];
    if (!file || !selectedPlan) return;

    const formData = new FormData();
    formData.append('proof', file);
    formData.append('plan', JSON.stringify(selectedPlan));
    formData.append('userId', '123'); // Reemplazar con ID real del usuario

    try {
        const response = await fetch('/verify-payment', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            document.getElementById('payment-status').textContent = "✅ Pago verificado. Activando servicio...";
            document.getElementById('activate-btn').disabled = false;
        } else {
            document.getElementById('payment-status').textContent = "❌ Error: " + result.message;
        }
    } catch (error) {
        console.error("Error:", error);
    }
});
console.log("settings.js cargado");

document.addEventListener('DOMContentLoaded', () => {
    const boton = document.getElementById('iniciar-bot');
    const estado = document.getElementById('estado');
    let miElemento = document.getElementById('miElemento');
  
    // Si no existe, créalo
    if (!miElemento) {
      console.warn('El elemento miElemento no existía, creando uno nuevo');
      
      // Crear el botón dinámicamente
      miElemento = document.createElement('button');
      miElemento.id = 'miElemento';
      miElemento.textContent = 'Botón dinámico';
      miElemento.style.cssText = `
        padding: 10px 15px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin: 10px;
      `;
      
      // Agregar al cuerpo del documento
      document.body.appendChild(miElemento);
    }
    
    // Ahora podemos usar el elemento (existente o recién creado)
    miElemento.addEventListener('click', function() {
      console.log('Botón miElemento fue clickeado');
      // Aquí puedes agregar cualquier funcionalidad necesaria
      alert('Funcionalidad del botón activada');
    });
    boton.addEventListener('click', async () => {
        estado.textContent = "Enviando...";
        estado.style.color = "blue";
        
        try {
            // Datos reales del formulario (ejemplo)
            const datos = {
                grupos: ["grupo1", "grupo2"],
                mensaje: "Prueba de mensaje",
                frecuencia: 5
            };

            const response = await fetch('http://localhost:5000/iniciar-bot', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(datos)
            });
            
            if (!response.ok) throw new Error("Error del servidor");
            
            const data = await response.json();
            estado.textContent = `✅ ${data.estado}`;
            estado.style.color = "green";

        } catch (error) {
            estado.textContent = `❌ ${error.message}`;
            estado.style.color = "red";
            console.error("Error:", error);
        }
    });
});