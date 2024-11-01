//this is just an example plugin that allows us to animate a "blur" property like gsap.to(target, {blur:10}) and it'll feed that value to this plugin which will do all the necessary calculations to add/update a blur() value in the CSS "filter" property (in browsers that support it). We wrap it in an iife just so that we can declare some local variables in a private scope at the top.
(function() {
	const blurProperty = gsap.utils.checkPrefix("filter"),
		    blurExp = /blur\((.+)?px\)/,
		    getBlurMatch = target => (gsap.getProperty(target, blurProperty) || "").match(blurExp) || [];

	gsap.registerPlugin({
		name: "blur",
		get(target) {
			return +(getBlurMatch(target)[1]) || 0;
		},
		init(target, endValue) {
			let data = this,
          filter = gsap.getProperty(target, blurProperty),
          endBlur = "blur(" + endValue + "px)",
          match = getBlurMatch(target)[0],
          index;
      if (filter === "none") {
        filter = "";
      }
      if (match) {
        index = filter.indexOf(match);
        endValue = filter.substr(0, index) + endBlur + filter.substr(index + match.length);
      } else {
        endValue = filter + endBlur;
        filter += filter ? " blur(0px)" : "blur(0px)";
      }
      data.target = target; 
      data.interp = gsap.utils.interpolate(filter, endValue); 
		},
		render(progress, data) {
			data.target.style[blurProperty] = data.interp(progress);
		}
	});
})();

//from now on, we can animate "blur" as a number! (Well, in browsers that support filter)
gsap.from("h1", {
	duration: 1,
	blur: 8,
  ease: "none",scrollTrigger: {
    trigger: "h1",
    start: "80px 400px",
    end: "bottom center",
    scrub: true
  }
});


// começa efeito mariposa
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

gsap.set("#motionIMG", { scale: 0.85, autoAlpha: 1 });
gsap.set(".mariposa", {transformOrigin: "50% 50%", scaleX: -1});
let getProp = gsap.getProperty("#motionIMG"),
    flippedX = false,
    flippedY = false;

gsap.to("#motionIMG", {
  scrollTrigger: {
    trigger: "#motionPath",
    start: "top center",
    end: 'bottom center',
    scrub: 0.7,
    markers: false,
    onUpdate: self => {
      let rotation = getProp("rotation"),
          flipY = Math.abs(rotation) > 90,
          flipX = self.direction === 1;
      if (flipY !== flippedY || flipX !== flippedX) {
        gsap.to(".mariposa", {scaleY: flipY ? -1 : 1, scaleX: flipX ? -1 : 1, duration: 0.25});
        flippedY = flipY;
        flippedX = flipX;
      }
    }
  },
  duration: 10,
  ease: pathEase("#motionPath", {smooth: true}), // <-- MAGIC!
  immediateRender: true,
  motionPath: {
    path: "#motionPath",
    align: "#motionPath",
    alignOrigin: [0.5, 0.5],
    autoRotate: 0
  }
});

/* 
Helper function that returns an ease that bends time to ensure the target moves on the y axis in a relatively steady fashion in relation to the viewport (assuming the progress of the tween is linked linearly to the scroll position). Requires MotionPathPlugin of course.
You can optionally pass in a config option with any of these properties: 
  - smooth: if true, the target can drift slightly in order to smooth out the movement. This is especially useful if the path curves backwards at times. It prevents super-fast motions at that point. You can define it as a number (defaults to 7) indicating how much to smooth it.
  - precision: number (defaults to 1) controlling the sampling size along the path. The higher the precision, the more accurate but the more processing.
  - axis: "y" or "x" ("y" by default)
*/ 
function pathEase(path, config={}) {
  let axis = config.axis || "y",
      precision = config.precision || 1,
      rawPath = MotionPathPlugin.cacheRawPathMeasurements(MotionPathPlugin.getRawPath(gsap.utils.toArray(path)[0]), Math.round(precision * 12)),
			useX = axis === "x",
			start = rawPath[0][useX ? 0 : 1],
			end = rawPath[rawPath.length - 1][rawPath[rawPath.length-1].length - (useX ? 2 : 1)],
			range = end - start,
			l = Math.round(precision * 200),
			inc = 1 / l,
			positions = [0],
			a = [],
			minIndex = 0,
      smooth = [0],
      minChange = (1 / l) * 0.6,
      smoothRange = config.smooth === true ? 7 : Math.round(config.smooth) || 0,
      fullSmoothRange = smoothRange * 2,
			getClosest = p => {
				while (positions[minIndex] <= p && minIndex++ < l) { }
				a.push(a.length && ((p - positions[minIndex-1]) / (positions[minIndex] - positions[minIndex - 1]) * inc + minIndex * inc));
        smoothRange && a.length > smoothRange && (a[a.length - 1] - a[a.length - 2] < minChange) && smooth.push(a.length - smoothRange);
			},
			i = 1;
  for (; i < l; i++) {
    positions[i] = (MotionPathPlugin.getPositionOnPath(rawPath, i / l)[axis] - start) / range;
  }
  positions[l] = 1;
  for (i = 0; i < l; i++) {
    getClosest(i / l);
  }
  a.push(1); // must end at 1.
  if (smoothRange) { // smooth at the necessary indexes where a small difference was sensed. Make it a linear change over the course of the fullSmoothRange
    smooth.push(l-fullSmoothRange+1);
    smooth.forEach(i => {
      let start = a[i],
          j = Math.min(i + fullSmoothRange, l),
          inc = (a[j] - start) / (j - i),
          c = 1;
      i++;
      for (; i < j; i++) {
        a[i] = start + inc * c++;
      }
    });
  }
  return p => {
    let i = p * l,
        s = a[i | 0];
    return i ? s + (a[Math.ceil(i)] - s) * (i % 1) : 0;
  }
}


// adaptação efeito mariposa para dipositivos móveis
const meuSvg = document.getElementById('meuSvg');

function ajustarViewBox() {
  const larguraTela = window.innerWidth;
  if (larguraTela < 500) {
    meuSvg.setAttribute('viewBox', '600 500 800 2000'); // Ajusta para telas menores que 500px
  } else {
    meuSvg.setAttribute('viewBox', '20 30 1450 1600.3'); // Ajusta para telas maiores que 500px
  }
}

// Chamar a função no carregamento da página e em cada redimensionamento
window.addEventListener('load', ajustarViewBox);
window.addEventListener('resize', ajustarViewBox);




