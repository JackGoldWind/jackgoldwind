/* brands.js — redes sociales: logos oficiales (carpeta icons/, de simple-icons, dominio público CC0)
   y color de marca. Lo usan el sitio público y el panel. Los logos son marcas de sus dueños. */
(function (root) {
  "use strict";
  var BRANDS = {"youtube": {"name": "YouTube", "color": "#FF0000"}, "twitch": {"name": "Twitch", "color": "#9146FF"}, "tiktok": {"name": "TikTok", "color": "#000000"}, "x": {"name": "X", "color": "#000000"}, "instagram": {"name": "Instagram", "color": "#FF0069"}, "discord": {"name": "Discord", "color": "#5865F2"}, "facebook": {"name": "Facebook", "color": "#0866FF"}, "telegram": {"name": "Telegram", "color": "#26A5E4"}, "whatsapp": {"name": "WhatsApp", "color": "#25D366"}, "steam": {"name": "Steam", "color": "#000000"}, "github": {"name": "GitHub", "color": "#181717"}, "kick": {"name": "Kick", "color": "#53FC19"}, "bluesky": {"name": "Bluesky", "color": "#1185FE"}, "threads": {"name": "Threads", "color": "#000000"}, "patreon": {"name": "Patreon", "color": "#000000"}, "kofi": {"name": "Ko-fi", "color": "#FF6433"}, "spotify": {"name": "Spotify", "color": "#1ED760"}, "reddit": {"name": "Reddit", "color": "#FF4500"}, "snapchat": {"name": "Snapchat", "color": "#FFFC00"}, "pinterest": {"name": "Pinterest", "color": "#BD081C"}, "soundcloud": {"name": "SoundCloud", "color": "#FF5500"}, "mail": {"name": "Correo", "color": "#EA4335"}, "throne": {"name": "Throne", "color": "#7B3FE4"}, "link": {"name": "Enlace", "color": "#4C8C86"}};
  var HOSTS = [
    [/(^|\.)throne\.(com|gg|me)$/, "throne"],
    [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, "youtube"], [/twitch\.tv$/, "twitch"], [/tiktok\.com$/, "tiktok"],
    [/(^|\.)x\.com$|twitter\.com$/, "x"], [/instagram\.com$/, "instagram"], [/discord\.(gg|com)$/, "discord"],
    [/facebook\.com$|(^|\.)fb\.com$/, "facebook"], [/(^|\.)t\.me$|telegram\.(me|org)$/, "telegram"],
    [/whatsapp\.com$|(^|\.)wa\.me$/, "whatsapp"], [/steamcommunity\.com$|steampowered\.com$/, "steam"],
    [/github\.com$/, "github"], [/kick\.com$/, "kick"], [/bsky\.app$/, "bluesky"], [/threads\.net$/, "threads"],
    [/patreon\.com$/, "patreon"], [/ko-fi\.com$/, "kofi"], [/spotify\.com$/, "spotify"], [/reddit\.com$/, "reddit"],
    [/snapchat\.com$/, "snapchat"], [/pinterest\./, "pinterest"], [/soundcloud\.com$/, "soundcloud"],
    [/^mail\.google\.com$|(^|\.)outlook\.(live|office)\.com$|^mail\.yahoo\.com$/, "mail"]
  ];
  function detectNetwork(url) {
    url = String(url || "").trim();
    if (/^mailto:/i.test(url) || /^[^\s@\/]+@[^\s@\/]+\.[a-z]{2,}$/i.test(url)) return "mail";
    try {
      var h = new URL(url).hostname.toLowerCase();
      for (var i = 0; i < HOSTS.length; i++) if (HOSTS[i][0].test(h)) return HOSTS[i][1];
    } catch (e) { /* no es una URL válida */ }
    return "link";
  }
  root.SITE_BRANDS = { BRANDS: BRANDS, detectNetwork: detectNetwork };
})(typeof window !== "undefined" ? window : this);
