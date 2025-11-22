// Initialize medium zoom.
$(document).ready(function () {
  medium_zoom = mediumZoom("[data-zoomable]", {
    background: getComputedStyle(document.documentElement).getPropertyValue("--global-bg-color") + "ee",
  });

  // Set the final transform and size before the animation starts so it snaps
  // directly to the 650px frame instead of briefly oversizing.
  medium_zoom.on("open", () => {
    const img = document.querySelector(".medium-zoom-image--opened");
    if (!img) return;
    Object.assign(img.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      width: "150px",
      height: "150px",
      transform: "translate(-50%, -50%) scale(1)",
      transformOrigin: "center center",
    });
  });

  medium_zoom.on("closed", () => {
    const img = document.querySelector(".medium-zoom-image--opened");
    if (!img) return;
    img.style.position = "";
    img.style.top = "";
    img.style.left = "";
    img.style.width = "";
    img.style.height = "";
    img.style.transform = "";
    img.style.transformOrigin = "";
  });
});
