---
---

/* 
Copied from https://github.com/derekkedziora/jekyll-demo/blob/master/scripts/mode-switcher.js
https://github.com/derekkedziora/jekyll-demo
Creative Commons Attribution 4.0 International License
*/

let systemInitiatedDark = window.matchMedia("(prefers-color-scheme: dark)");
let theme = sessionStorage.getItem('theme');

const iconSun = "{{ site.baseurl }}/assets/img/sun.svg";
const iconMoon = "{{ site.baseurl }}/assets/img/moon.svg";


function changeIconImgSrc(src) {
	["theme-toggle-img", "theme-toggle-img--mobile"].forEach((id) => {
		const icon = document.getElementById(id);
		if (icon) {
			icon.src = src;
		}
	});
}

if (systemInitiatedDark.matches) {
	changeIconImgSrc(iconMoon);
} else {
	changeIconImgSrc(iconSun);
}

function prefersColorTest(systemInitiatedDark) {
  if (systemInitiatedDark.matches) {
  	document.documentElement.setAttribute('data-theme', 'dark');		
   	changeIconImgSrc(iconMoon);
   	sessionStorage.setItem('theme', 'dark');
  } else {
  	document.documentElement.setAttribute('data-theme', 'light');
    changeIconImgSrc(iconSun);
    sessionStorage.setItem('theme', 'light');
  }
}
if (systemInitiatedDark.addEventListener) {
	systemInitiatedDark.addEventListener("change", prefersColorTest);
} else {
	systemInitiatedDark.addListener(prefersColorTest);
}


function modeSwitcher() {
	let theme = sessionStorage.getItem('theme');
	if (theme === "dark") {
		document.documentElement.setAttribute('data-theme', 'light');
		sessionStorage.setItem('theme', 'light');
		changeIconImgSrc(iconSun);
	}	else if (theme === "light") {
		document.documentElement.setAttribute('data-theme', 'dark');
		sessionStorage.setItem('theme', 'dark');
		changeIconImgSrc(iconMoon);
	} else if (systemInitiatedDark.matches) {	
		document.documentElement.setAttribute('data-theme', 'light');
		sessionStorage.setItem('theme', 'light');
		changeIconImgSrc(iconSun);
	} else {
		document.documentElement.setAttribute('data-theme', 'dark');
		sessionStorage.setItem('theme', 'dark');
		changeIconImgSrc(iconMoon);
	}
}

if (theme === "dark") {
	document.documentElement.setAttribute('data-theme', 'dark');
	sessionStorage.setItem('theme', 'dark');
	changeIconImgSrc(iconMoon);
} else if (theme === "light") {
	document.documentElement.setAttribute('data-theme', 'light');
	sessionStorage.setItem('theme', 'light');
	changeIconImgSrc(iconSun);
}

document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
		button.addEventListener("click", modeSwitcher);
	});
});
