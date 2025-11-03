// Carrossel de produtos em destaque
const carouselContainer = document.getElementById("carousel-container");
const items = document.querySelectorAll(".carousel-item");
const totalItems = items.length;
let index = 0;
let autoSlide;

function updateCarousel() {
  carouselContainer.style.transform = `translateX(${-index * 100}%)`;
}

function nextSlide() {
  index = (index + 1) % totalItems;
  updateCarousel();
}

function prevSlide() {
  index = (index - 1 + totalItems) % totalItems;
  updateCarousel();
}

document.getElementById("next").addEventListener("click", () => {
  nextSlide();
  resetAutoSlide();
});

document.getElementById("prev").addEventListener("click", () => {
  prevSlide();
  resetAutoSlide();
});

function startAutoSlide() {
  autoSlide = setInterval(nextSlide, 5000);
}

function resetAutoSlide() {
  clearInterval(autoSlide);
  startAutoSlide();
}

startAutoSlide();
