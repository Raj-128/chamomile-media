// Google Analytics 4. Paste the Measurement ID (looks like G-XXXXXXXXXX) to switch it on;
// while it is empty nothing loads. Mark the thank-you.html page view as a key event in GA4
// to count form leads.
const GA_MEASUREMENT_ID = "";

if (GA_MEASUREMENT_ID) {
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.append(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);
}
