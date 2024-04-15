document.addEventListener("DOMContentLoaded", iniciarApp);

function iniciarApp() {
  const resultado = document.querySelector("#resultado");
  const selectCategorias = document.querySelector("#categorias");

  if (selectCategorias) {
    selectCategorias.addEventListener("change", seleccionarCategoria);
    obtenerCategorias();
  }

  const favoritosDiv = document.querySelector(".favoritos");
  if (favoritosDiv) {
    obtenerFavoritos();
  }

  const modal = new bootstrap.Modal("#modal", {});

  // ---------------------------------------

  function obtenerCategorias() {
    fetch("https://www.themealdb.com/api/json/v1/1/categories.php")
      .then((resultado) => resultado.json())
      .then((datos) => mostrarCategorias(datos.categories));
  }

  // ----------------------------------------

  function mostrarCategorias(categorias = []) {
    categorias.forEach((categoria) => {
      // Scripting
      const { strCategory } = categoria;
      const option = document.createElement("OPTION");
      option.value = strCategory;
      option.textContent = strCategory;
      selectCategorias.appendChild(option);
    });
  }

  // -----------------------------------------

  function seleccionarCategoria(e) {
    const categoria = e.target.value;
    const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;
    fetch(url)
      .then((resultado) => resultado.json())
      .then((resultado) => mostrarRecetas(resultado.meals));
  }

  // ----------------------------------------

  function mostrarRecetas(recetas = []) {
    limpiarHTML(resultado);

    const heading = document.createElement("H2");
    heading.className = "text-center text-black my-5";
    heading.textContent = recetas.length ? "Resultados" : "No hay resultados";
    resultado.appendChild(heading);

    // Iterar cada receta
    recetas.forEach((receta) => {
      const { idMeal, strMeal, strMealThumb } = receta;

      // Scripting
      const recetaContenedor = document.createElement("DIV");
      recetaContenedor.className = "col-md-4";

      const recetaCard = document.createElement("DIV");
      recetaCard.className = "card mb-4";

      const recetaImagen = document.createElement("IMG");
      recetaImagen.className = "card-img-top";
      recetaImagen.alt = `Imagen de la receta ${strMeal ?? receta.titulo}`;
      recetaImagen.src = strMealThumb ?? receta.img;

      const recetaCardBody = document.createElement("DIV");
      recetaCardBody.className = "card-body";

      const recetaHeading = document.createElement("H3");
      recetaHeading.className = "card-title mb-3";
      recetaHeading.textContent = strMeal ?? receta.titulo;

      const recetaButton = document.createElement("BUTTON");
      recetaButton.className = "btn btn-danger w-100";
      recetaButton.textContent = "Ver receta";
      //recetaButton.dataset.bsTarget = "#modal";
      //recetaButton.dataset.bsToggle = "modal"

      recetaButton.onclick = function () {
        seleccionarReceta(idMeal ?? receta.id);
      };

      // -----------------------Inyectar en el codigo HTML

      recetaCardBody.appendChild(recetaHeading);
      recetaCardBody.appendChild(recetaButton);

      recetaCard.appendChild(recetaImagen);
      recetaCard.appendChild(recetaCardBody);

      recetaContenedor.appendChild(recetaCard);

      resultado.appendChild(recetaContenedor);
    });
  }

  // ------------------------------------------

  function seleccionarReceta(idMeal) {
    const URL = `https://themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`;
    fetch(URL)
      .then((resultado) => resultado.json())
      .then((resultado) => mostrarRecetaModal(resultado["meals"][0]));
  }

  // -------------------------------------------

  function mostrarRecetaModal(receta) {
    const { idMeal, strInstructions, strMeal, strMealThumb } = receta;

    // Agregar contenido al modal
    const modalTitle = document.querySelector(".modal .modal-title");
    const modalBody = document.querySelector(".modal .modal-body");

    modalTitle.textContent = strMeal;
    modalBody.innerHTML = `
        <img class="img-fluid" src="${strMealThumb}" alt="receta ${strMeal}" />
        <h3 class="my-3">Instrucciones</h3>
        <p>${strInstructions}</p>
        <h3 class="my-3">Ingredientes y cantidades</h3>
    `;

    const listGroup = document.createElement("UL");
    listGroup.className = "list-group";
    // Mostrar ingredientes
    for (let i = 1; i <= 20; i++) {
      if (receta[`strIngredient${i}`]) {
        const ingrediente = receta[`strIngredient${i}`];
        const cantidad = receta[`strMeasure${i}`];

        const ingredientLi = document.createElement("LI");
        ingredientLi.className = "list-group-item";
        ingredientLi.textContent = `${ingrediente} - ${cantidad}`;

        listGroup.appendChild(ingredientLi);
      }
    }
    modalBody.appendChild(listGroup);
    const modalFooter = document.querySelector(".modal-footer");
    // Antes de crear nuevos botones debemos limpiar los anteriores
    // El modal se comparte para todas las recetas...
    limpiarHTML(modalFooter);

    // Crear botones de cerrar y favorito
    const btnFavorito = document.createElement("BUTTON");
    btnFavorito.classList.add("btn", "btn-danger", "col");
    btnFavorito.textContent = existeStorage(idMeal)
      ? "Eliminar Favorito"
      : "Guardar Favorito";

    const btnCerrarModal = document.createElement("BUTTON");
    btnCerrarModal.classList.add("btn", "btn-secondary", "col");
    btnCerrarModal.textContent = "Cerrar";
    btnCerrarModal.onclick = () => {
      modal.hide();
    };

    modalFooter.appendChild(btnFavorito);
    modalFooter.appendChild(btnCerrarModal);

    // Muestra el modal
    modal.show();

    // LocalStorage ----------

    btnFavorito.onclick = () => {
      if (existeStorage(idMeal)) {
        eliminarFavorito(idMeal);
        btnFavorito.textContent = "Guarda Favorito";
        mostrarToast("Eliminado correctamente");
        return;
      }
      btnFavorito.textContent = "Eliminar Favorito";

      agregarFavorito({
        id: idMeal,
        titulo: strMeal,
        img: strMealThumb,
      });
      mostrarToast("Agregado correctamente");
    };
  }

  // ----------------------------------------

  function agregarFavorito(receta) {
    const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    localStorage.setItem("favoritos", JSON.stringify([...favoritos, receta]));
  }

  // ----------------------------------------

  function eliminarFavorito(id) {
    const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    const nuevosFavoritos = favoritos.filter((favorito) => favorito.id !== id);
    localStorage.setItem("favoritos", JSON.stringify(nuevosFavoritos));
  }

  // ----------------------------------------

  function existeStorage(id) {
    const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    return favoritos.some((favorito) => favorito.id === id);
  }

  // ---------------------------------------

  function obtenerFavoritos() {
    const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    if (favoritos.length) {
      console.log(favoritos);
      mostrarRecetas(favoritos);
      return;
    }
    const noFavoritos = document.createElement("P");
    noFavoritos.textContent = "No hay favoritos aun";
    noFavoritos.classList.add("fs-4", "text-center", "font-bold", "mt-5");
    favoritosDiv.appendChild(noFavoritos);
  }

  // ---------------------------------------

  function limpiarHTML(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  }

  // ----------------------------------------

  function mostrarToast(mensaje) {
    const toastDiv = document.querySelector("#toast");
    const toastBody = document.querySelector(".toast-body");
    const toast = new bootstrap.Toast(toastDiv);
    toastBody.textContent = mensaje;
    toast.show();
  }
}
