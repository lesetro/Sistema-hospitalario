
  function cargarEnMain(url) {
    fetch(url)
      .then(res => res.text())
      .then(html => {
        document.getElementById("main").innerHTML = html;
      })
      .catch(err => {
        console.error("Error al cargar el contenido:", err);
      });
  }
  
