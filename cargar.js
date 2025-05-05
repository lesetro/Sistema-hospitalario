//ejemplo de como deberia hacer las peticiones con el fech
// son multiples fech, cada uno para una peticion diferente
// y cada uno con su respectivo metodo, en este caso GET, POST y DELETE
// y cada uno con su respectivo endpoint
document.addEventListener('DOMContentLoaded', () => {
    const dataContainer = document.getElementById('data-container');
    const addItemForm = document.getElementById('addItemForm');
    const deleteItemBtn = document.getElementById('deleteItemBtn');
    const itemIdToDeleteInput = document.getElementById('itemIdToDelete');

    // Función para realizar una petición GET
    const fetchData = async () => {
        try {
            const response = await fetch('/api/items');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            displayData(data);
        } catch (error) {
            console.error('Error al obtener datos:', error);
            dataContainer.textContent = 'Error al cargar los datos.';
        }
    };

    // Función para mostrar los datos en la página
    const displayData = (items) => {
        dataContainer.innerHTML = '<h3>Items:</h3><ul>' +
                                items.map(item => `<li>ID: ${item.id}, Nombre: ${item.name}</li>`).join('') +
                                '</ul>';
    };

    // Cargar los datos iniciales al cargar la página
    fetchData();

    // Manejar el envío del formulario POST
    addItemForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const itemName = document.getElementById('newItem').value;

        try {
            const response = await fetch('/api/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: itemName }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const newItem = await response.json();
            console.log('Item agregado:', newItem);
            // Volver a cargar los datos para mostrar el nuevo item
            fetchData();
            addItemForm.reset();
        } catch (error) {
            console.error('Error al agregar item:', error);
        }
    });

    // Manejar el clic del botón DELETE
    deleteItemBtn.addEventListener('click', async () => {
        const itemId = itemIdToDeleteInput.value;
        if (!itemId) {
            alert('Por favor, ingresa el ID del item a eliminar.');
            return;
        }

        try {
            const response = await fetch(`/api/items/${itemId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            console.log('Resultado de la eliminación:', result);
            // Volver a cargar los datos para reflejar la eliminación
            fetchData();
            itemIdToDeleteInput.value = '';
        } catch (error) {
            console.error('Error al eliminar item:', error);
        }
    });
});