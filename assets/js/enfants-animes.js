/* Enfants animés : les animations ne tournent que lorsque l’illustration est à l’écran. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle('is-paused', !entry.isIntersecting);
    });
  });
  document.querySelectorAll('.puppet').forEach(function (puppet) {
    observer.observe(puppet);
  });
})();
