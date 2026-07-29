// AUTO-GENERATED — node scripts/build-pic-manifest.mjs
// Personal background images served from public/pic/<desktop|mobile>/.
// Each entry becomes its own theme in the Theme Library; the renderer
// picks the desktop or mobile URL based on the viewport width.

export interface PersonalPic {
  /** Stable theme id, used by useFlocusStore.settings.theme* */
  id: string
  /** Human-readable label shown under the swatch */
  name: string
  /** Landscape image URL — preferred on viewports ≥ 768px wide */
  desktop: string | null
  /** Portrait image URL — preferred on viewports < 768px wide */
  mobile: string | null
}

export const PERSONAL_PICS: readonly PersonalPic[] = [
  {
    "id": "clouds",
    "name": "Clouds",
    "desktop": "/pic/desktop/CloudsH.png",
    "mobile": "/pic/mobile/CloudsV.png"
  },
  {
    "id": "darkclouds",
    "name": "Dark Clouds",
    "desktop": "/pic/desktop/darkCloudsH.png",
    "mobile": "/pic/mobile/darkCloudsV.png"
  },
  {
    "id": "excalibur",
    "name": "Excalibur",
    "desktop": "/pic/desktop/excaliburH.png",
    "mobile": "/pic/mobile/excaliburV.png"
  },
  {
    "id": "field",
    "name": "Field",
    "desktop": "/pic/desktop/fieldH.png",
    "mobile": "/pic/mobile/fieldV.png"
  },
  {
    "id": "gameofobstacles-a-kodak-film-photograph-depicting-an-enormou",
    "name": "Gameofobstacles A",
    "desktop": "/pic/desktop/gameofobstacles_a_Kodak_film_photograph_depicting_an_enormous_f%20(2).png",
    "mobile": "/pic/mobile/gameofobstacles_a_Kodak_film_photograph_depicting_an_enormous_f.png"
  },
  {
    "id": "img-0452",
    "name": "Photo 0452",
    "desktop": "/pic/desktop/IMG_0452.PNG",
    "mobile": "/pic/mobile/IMG_0451.PNG"
  },
  {
    "id": "img-1008",
    "name": "Photo 1008",
    "desktop": "/pic/desktop/IMG_1008.JPG",
    "mobile": "/pic/mobile/IMG_1009.JPG"
  },
  {
    "id": "img-1059",
    "name": "Photo 1059",
    "desktop": "/pic/desktop/IMG_1059.JPG",
    "mobile": "/pic/mobile/IMG_1058.JPG"
  },
  {
    "id": "12",
    "name": "Photo 12",
    "desktop": "/pic/desktop/12.PNG",
    "mobile": "/pic/mobile/11.PNG"
  },
  {
    "id": "img-1550",
    "name": "Photo 1550",
    "desktop": "/pic/desktop/IMG_1550.JPG",
    "mobile": "/pic/mobile/IMG_1549.JPG"
  },
  {
    "id": "img-1552",
    "name": "Photo 1552",
    "desktop": "/pic/desktop/IMG_1552.JPG",
    "mobile": "/pic/mobile/IMG_1553.JPG"
  },
  {
    "id": "img-1624",
    "name": "Photo 1624",
    "desktop": "/pic/desktop/IMG_1624.PNG",
    "mobile": "/pic/mobile/IMG_1625.PNG"
  },
  {
    "id": "img-1627",
    "name": "Photo 1627",
    "desktop": "/pic/desktop/IMG_1627.PNG",
    "mobile": "/pic/mobile/IMG_1628.PNG"
  },
  {
    "id": "img-1720",
    "name": "Photo 1720",
    "desktop": "/pic/desktop/IMG_1720.JPG",
    "mobile": "/pic/mobile/IMG_1719.JPG"
  },
  {
    "id": "img-2718",
    "name": "Photo 2718",
    "desktop": "/pic/desktop/IMG_2718.PNG",
    "mobile": "/pic/mobile/IMG_2713.PNG"
  },
  {
    "id": "img-3042",
    "name": "Photo 3042",
    "desktop": "/pic/desktop/IMG_3042.PNG",
    "mobile": "/pic/mobile/IMG_3037.PNG"
  },
  {
    "id": "32",
    "name": "Photo 32",
    "desktop": "/pic/desktop/32.PNG",
    "mobile": "/pic/mobile/31.png"
  },
  {
    "id": "img-4921",
    "name": "Photo 4921",
    "desktop": "/pic/desktop/IMG_4921.JPG",
    "mobile": "/pic/mobile/IMG_4920.JPG"
  },
  {
    "id": "img-5040",
    "name": "Photo 5040",
    "desktop": "/pic/desktop/IMG_5040.JPG",
    "mobile": "/pic/mobile/IMG_5028.JPG"
  },
  {
    "id": "img-5438",
    "name": "Photo 5438",
    "desktop": "/pic/desktop/IMG_5438.JPG",
    "mobile": "/pic/mobile/IMG_5437.JPG"
  },
  {
    "id": "samurai",
    "name": "Samurai",
    "desktop": "/pic/desktop/samuraiH.png",
    "mobile": "/pic/mobile/samuraiV.png"
  },
  {
    "id": "skull",
    "name": "Skull",
    "desktop": "/pic/desktop/skullh.png",
    "mobile": "/pic/mobile/skullv.png"
  },
  {
    "id": "sun",
    "name": "Sun",
    "desktop": "/pic/desktop/sunH.png",
    "mobile": "/pic/mobile/sunV.png"
  },
  {
    "id": "sunflowers",
    "name": "Sunflowers",
    "desktop": "/pic/desktop/sunflowersH.png",
    "mobile": "/pic/mobile/sunflowersV.png"
  }
]

export const PIC_DESKTOP: readonly string[] = PERSONAL_PICS
  .map((p) => p.desktop)
  .filter((url): url is string => url !== null)

export const PIC_MOBILE: readonly string[] = PERSONAL_PICS
  .map((p) => p.mobile)
  .filter((url): url is string => url !== null)

export const HAS_PERSONAL_PICS = PERSONAL_PICS.length > 0
