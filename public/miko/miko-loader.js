(function () {
  if (document.getElementById("miko-style")) return;

  const style = document.createElement("link");
  style.id = "miko-style";
  style.rel = "stylesheet";
  style.href = "/miko/miko.css";

  document.head.appendChild(style);

  const script = document.createElement("script");
  script.src = "/miko/miko.js";
  script.defer = true;

  document.head.appendChild(script);
})();
