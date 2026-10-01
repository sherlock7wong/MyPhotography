(function () {
  const photos = [
    {
      id: "old-street",
      title: "Old Street, Late Afternoon",
      category: "city-humanity",
      categoryLabel: "City Humanity",
      year: 2024,
      date: "Mar 02, 2024",
      location: "Shanghai, China",
      image: "../Project/assets/project-city-rhythm.png",
      alt: "People walking through an old city street in late afternoon light",
      description: "A slow walk through the old block. The street kept its own pace while the light settled between the buildings.",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/4",
      shutter: "1/250s",
      iso: "400",
      featured: true,
      layout: "normal"
    },
    {
      id: "window-light",
      title: "Window Light",
      category: "portrait",
      categoryLabel: "Portrait",
      year: 2024,
      date: "May 12, 2024",
      location: "Shenzhen, China",
      image: "../Home/assets/portrait.png",
      alt: "A quiet portrait beside a window in soft light",
      description: "A portrait held by window light. The room was quiet, and the face stayed close to the edge of shadow.",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/2.0",
      shutter: "1/500s",
      iso: "200",
      featured: true,
      layout: "normal"
    },
    {
      id: "coastline",
      title: "Coastline",
      category: "landscape",
      categoryLabel: "Landscape",
      year: 2024,
      date: "Apr 18, 2024",
      location: "Northern California, USA",
      image: "../Project/assets/project-edges-light.png",
      alt: "A misty coastline with waves and cliffs",
      description: "Fog cleared in the afternoon. The light was soft and the air was clean. Moments like this stay with me.",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/5.6",
      shutter: "1/500s",
      iso: "200",
      featured: true,
      layout: "wide"
    },
    {
      id: "crossing",
      title: "Crossing",
      category: "city-humanity",
      categoryLabel: "City Humanity",
      year: 2023,
      date: "Nov 10, 2023",
      location: "Shanghai, China",
      image: "../Home/assets/city-humanity.png",
      alt: "A person crossing a quiet city street",
      description: "The street opened for a few seconds, then closed again. A single crossing became the whole frame.",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/5.6",
      shutter: "1/320s",
      iso: "320",
      featured: true,
      layout: "normal"
    },
    {
      id: "distant-ridge",
      title: "Distant Ridge",
      category: "landscape",
      categoryLabel: "Landscape",
      year: 2022,
      date: "Oct 06, 2022",
      location: "Yunnan, China",
      image: "../Home/assets/landscape.png",
      alt: "Layered mountains and a lake under soft haze",
      description: "A quiet ridge after rain. The layers of water, mountain, and air held the image together.",
      camera: "SONY A7C",
      lens: "35mm f/1.8",
      aperture: "f/8",
      shutter: "1/400s",
      iso: "160",
      featured: true,
      layout: "normal"
    },
    {
      id: "highlands",
      title: "Highlands",
      category: "landscape",
      categoryLabel: "Landscape",
      year: 2020,
      date: "Sep 19, 2020",
      location: "Yunnan, China",
      image: "../Project/assets/project-highlands.png",
      alt: "A mountain ridge in warm light with distant peaks",
      description: "The mountains folded into one another. I waited for the haze to thin and kept the frame simple.",
      camera: "FUJIFILM X-T30",
      lens: "35mm f/2",
      aperture: "f/7.1",
      shutter: "1/250s",
      iso: "200",
      featured: true,
      layout: "wide"
    },
    {
      id: "morning-room",
      title: "Morning Room",
      category: "personal",
      categoryLabel: "Personal",
      year: 2024,
      date: "Jan 21, 2024",
      location: "Shenzhen, China",
      image: "../Home/assets/personal.png",
      alt: "A quiet table scene with warm morning light",
      description: "A small room before the day began. Nothing happened, and that was the reason to keep it.",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/2.8",
      shutter: "1/125s",
      iso: "640",
      featured: true,
      layout: "normal"
    },
    {
      id: "seen-in-silence",
      title: "Seen in Silence",
      category: "portrait",
      categoryLabel: "Portrait",
      year: 2021,
      date: "Aug 14, 2021",
      location: "Shenzhen, China",
      image: "../Project/assets/project-seen-silence.png",
      alt: "A portrait in a muted room with soft light",
      description: "The expression arrived without direction. I kept the composition spare and let the silence do the work.",
      camera: "FUJIFILM X-T30",
      lens: "35mm f/2",
      aperture: "f/2.2",
      shutter: "1/250s",
      iso: "400",
      featured: false,
      layout: "normal"
    },
    {
      id: "city-rhythm",
      title: "City Rhythm",
      category: "city-humanity",
      categoryLabel: "City Humanity",
      year: 2023,
      date: "Dec 04, 2023",
      location: "Shanghai, China",
      image: "../Project/assets/project-city-rhythm.png",
      alt: "A quiet street scene with a person crossing",
      description: "A city photograph built from small timing: one step, one lane, one pause in traffic.",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/5.6",
      shutter: "1/500s",
      iso: "250",
      featured: false,
      layout: "normal"
    },
    {
      id: "book-and-cup",
      title: "Book and Cup",
      category: "personal",
      categoryLabel: "Personal",
      year: 2023,
      date: "Feb 09, 2023",
      location: "Shenzhen, China",
      image: "../Home/assets/photographer.png",
      alt: "A camera and cup beside a window",
      description: "A desk fragment from a working afternoon. The photograph is more about attention than objects.",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/2.8",
      shutter: "1/160s",
      iso: "500",
      featured: false,
      layout: "normal"
    },
    {
      id: "edges-of-light",
      title: "Edges of Light",
      category: "landscape",
      categoryLabel: "Landscape",
      year: 2022,
      date: "Jun 26, 2022",
      location: "Northern California, USA",
      image: "../Project/assets/project-edges-light.png",
      alt: "Coastline cliffs under a soft sky",
      description: "A repeated return to the coastline. The image sits between weather, distance, and soft light.",
      camera: "SONY A7C",
      lens: "35mm f/1.8",
      aperture: "f/9",
      shutter: "1/320s",
      iso: "100",
      featured: false,
      layout: "wide"
    }
  ];

  const portraitPhotos = [
    {
      id: "portrait-quiet-glance",
      title: "Quiet Glance",
      category: "portrait",
      categoryLabel: "Portrait",
      style: "studio",
      styleLabel: "Studio",
      year: 2024,
      date: "May 12, 2024",
      location: "Shenzhen, China",
      image: "../Home/assets/portrait.png",
      alt: "A quiet side portrait beside a window",
      description: "A restrained portrait in soft window light. The face stays calm while the room keeps its shadow.",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/2.0",
      shutter: "1/500s",
      iso: "200",
      featured: true,
      layout: "normal"
    },
    {
      id: "portrait-city-rhythm",
      title: "City Rhythm",
      category: "portrait",
      categoryLabel: "Portrait",
      style: "street",
      styleLabel: "Street",
      year: 2024,
      date: "Apr 03, 2024",
      location: "Shanghai, China",
      image: "../Home/assets/photographer.png",
      alt: "A street portrait with a camera in muted light",
      description: "A street portrait made between movement and pause. The city stays present without becoming loud.",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/2.8",
      shutter: "1/500s",
      iso: "320",
      featured: false,
      layout: "normal"
    },
    {
      id: "portrait-window-light",
      title: "Window Light",
      category: "portrait",
      categoryLabel: "Portrait",
      style: "natural-light",
      styleLabel: "Natural Light",
      year: 2024,
      date: "May 12, 2024",
      location: "Shenzhen, China",
      image: "../Project/assets/project-seen-silence.png",
      alt: "A portrait held by clean natural light",
      description: "午后的窗边，光以柔和的角度落在她的脸上，安静、清晰，也足够真实。",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/2.0",
      shutter: "1/500s",
      iso: "200",
      featured: true,
      layout: "normal"
    },
    {
      id: "portrait-close-to-you",
      title: "Close to You",
      category: "portrait",
      categoryLabel: "Portrait",
      style: "close-up",
      styleLabel: "Close-up",
      year: 2024,
      date: "May 18, 2024",
      location: "Shenzhen, China",
      image: "../Home/assets/portrait.png",
      alt: "A close portrait in soft shadow",
      description: "A closer frame, held just long enough for expression to become the subject.",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/2.0",
      shutter: "1/500s",
      iso: "200",
      featured: false,
      layout: "normal"
    },
    {
      id: "portrait-afternoon",
      title: "Afternoon",
      category: "portrait",
      categoryLabel: "Portrait",
      style: "natural-light",
      styleLabel: "Natural Light",
      year: 2023,
      date: "Sep 08, 2023",
      location: "Shenzhen, China",
      image: "../Home/assets/photographer.png",
      alt: "A portrait in afternoon shadow",
      description: "Late light and a still wall. The frame keeps the portrait simple and direct.",
      camera: "FUJIFILM X-T30",
      lens: "35mm f/2",
      aperture: "f/2.8",
      shutter: "1/320s",
      iso: "400",
      featured: false,
      layout: "normal"
    },
    {
      id: "portrait-neutral",
      title: "Neutral",
      category: "portrait",
      categoryLabel: "Portrait",
      style: "studio",
      styleLabel: "Studio",
      year: 2023,
      date: "Jul 22, 2023",
      location: "Shenzhen, China",
      image: "../Project/assets/project-seen-silence.png",
      alt: "A neutral portrait against a plain background",
      description: "A quiet frame against a plain wall, where expression and posture carry the photograph.",
      camera: "FUJIFILM X-T30",
      lens: "35mm f/2",
      aperture: "f/2.2",
      shutter: "1/250s",
      iso: "320",
      featured: false,
      layout: "normal"
    },
    {
      id: "portrait-under-tree",
      title: "Under the Tree",
      category: "portrait",
      categoryLabel: "Portrait",
      style: "natural-light",
      styleLabel: "Natural Light",
      year: 2024,
      date: "Jun 02, 2024",
      location: "Shenzhen, China",
      image: "../Home/assets/portrait.png",
      alt: "A portrait under soft outdoor light",
      description: "A portrait made under trees, where the background softens and the face keeps the center.",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/2.8",
      shutter: "1/500s",
      iso: "250",
      featured: false,
      layout: "normal"
    },
    {
      id: "portrait-passing-by",
      title: "Passing By",
      category: "portrait",
      categoryLabel: "Portrait",
      style: "street",
      styleLabel: "Street",
      year: 2024,
      date: "Mar 28, 2024",
      location: "Shanghai, China",
      image: "../Project/assets/project-city-rhythm.png",
      alt: "A passing street portrait in a narrow city lane",
      description: "A portrait made quickly in the street, between a glance and the next step.",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/4",
      shutter: "1/500s",
      iso: "320",
      featured: false,
      layout: "normal"
    }
  ];

  const landscapePhotos = [
    {
      id: "landscape-mountain-clouds",
      title: "山间云雾",
      category: "landscape",
      categoryLabel: "Landscape",
      style: "mountain",
      styleLabel: "Mountain",
      year: 2024,
      date: "Oct 12, 2024",
      location: "Dolomites, Italy",
      image: "../Project/assets/project-highlands.png",
      alt: "Clouds moving across mountain valleys",
      description: "清晨的山谷被雾气覆盖，远处的山脊若隐若现。空气湿冷，光线柔和，时间仿佛在这一刻静止。",
      camera: "FUJIFILM GFX 50R",
      lens: "63mm f/2.8",
      aperture: "f/8.0",
      shutter: "1/125s",
      iso: "100",
      featured: true,
      layout: "tall"
    },
    {
      id: "landscape-coast-road",
      title: "海岸公路",
      category: "landscape",
      categoryLabel: "Landscape",
      style: "coast",
      styleLabel: "Coast",
      year: 2024,
      date: "Apr 18, 2024",
      location: "Northern California, USA",
      image: "../Project/assets/project-edges-light.png",
      alt: "A coast road beside a muted sea",
      description: "沿着海岸线行驶，雾气从海面慢慢退去，公路和山体在灰色天空下显得安静。",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/5.6",
      shutter: "1/500s",
      iso: "200",
      featured: false,
      layout: "wide"
    },
    {
      id: "landscape-high-valley",
      title: "高地远景",
      category: "landscape",
      categoryLabel: "Landscape",
      style: "mountain",
      styleLabel: "Mountain",
      year: 2024,
      date: "Sep 06, 2024",
      location: "Yunnan, China",
      image: "../Home/assets/landscape.png",
      alt: "Layered highland mountains under soft haze",
      description: "山谷层层展开，水面和远山之间保留着一段安静的距离。",
      camera: "SONY A7C",
      lens: "35mm f/1.8",
      aperture: "f/8",
      shutter: "1/400s",
      iso: "160",
      featured: true,
      layout: "tall"
    },
    {
      id: "landscape-forest-light",
      title: "林间光影",
      category: "landscape",
      categoryLabel: "Landscape",
      style: "forest",
      styleLabel: "Forest",
      year: 2024,
      date: "Jun 15, 2024",
      location: "Shenzhen, China",
      image: "../Home/assets/personal.png",
      alt: "Soft light passing through a quiet interior scene",
      description: "光线穿过密集的阴影，像是在林间短暂停留。",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/2.8",
      shutter: "1/160s",
      iso: "500",
      featured: false,
      layout: "wide"
    },
    {
      id: "landscape-quiet-field",
      title: "静谧的田野",
      category: "landscape",
      categoryLabel: "Landscape",
      style: "field",
      styleLabel: "Field",
      year: 2023,
      date: "Jul 09, 2023",
      location: "New Zealand, South Island",
      image: "../Project/assets/project-highlands.png",
      alt: "A quiet open field below distant hills",
      description: "远处的坡地和低云连在一起，田野像一段被拉长的呼吸。",
      camera: "FUJIFILM X-T30",
      lens: "35mm f/2",
      aperture: "f/7.1",
      shutter: "1/250s",
      iso: "200",
      featured: false,
      layout: "wide"
    },
    {
      id: "landscape-evening-bay",
      title: "黄昏海湾",
      category: "landscape",
      categoryLabel: "Landscape",
      style: "coast",
      styleLabel: "Coast",
      year: 2023,
      date: "Nov 02, 2023",
      location: "Northern California, USA",
      image: "../Project/assets/project-edges-light.png",
      alt: "A muted bay under evening light",
      description: "黄昏时海面变暗，最后一点光压在云层下方。",
      camera: "SONY A7C",
      lens: "35mm f/1.8",
      aperture: "f/9",
      shutter: "1/320s",
      iso: "100",
      featured: false,
      layout: "normal"
    },
    {
      id: "landscape-winter-lake",
      title: "冬日湖畔",
      category: "landscape",
      categoryLabel: "Landscape",
      style: "weather",
      styleLabel: "Weather",
      year: 2023,
      date: "Jan 17, 2023",
      location: "Yunnan, China",
      image: "../Home/assets/landscape.png",
      alt: "A lake below winter mountains",
      description: "冬天的湖面更安静，山和水都被冷空气包住。",
      camera: "FUJIFILM X-T30",
      lens: "35mm f/2",
      aperture: "f/8",
      shutter: "1/400s",
      iso: "160",
      featured: false,
      layout: "normal"
    },
    {
      id: "landscape-storm-coming",
      title: "风暴来临",
      category: "landscape",
      categoryLabel: "Landscape",
      style: "weather",
      styleLabel: "Weather",
      year: 2024,
      date: "Aug 21, 2024",
      location: "Northern California, USA",
      image: "../Project/assets/project-edges-light.png",
      alt: "Heavy clouds moving over a coast",
      description: "云层压低，风从海面过来，整片风景在暗处缓慢变化。",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/5.6",
      shutter: "1/500s",
      iso: "200",
      featured: false,
      layout: "wide"
    },
    {
      id: "landscape-sunlit-ridge",
      title: "日照山脊",
      category: "landscape",
      categoryLabel: "Landscape",
      style: "mountain",
      styleLabel: "Mountain",
      year: 2024,
      date: "Sep 18, 2024",
      location: "Yunnan, China",
      image: "../Project/assets/project-highlands.png",
      alt: "A ridge touched by warm light",
      description: "光线短暂落在山脊上，颜色变暖，远处仍然保持沉静。",
      camera: "FUJIFILM GFX 50R",
      lens: "63mm f/2.8",
      aperture: "f/8.0",
      shutter: "1/125s",
      iso: "100",
      featured: false,
      layout: "wide"
    },
    {
      id: "landscape-lone-tree",
      title: "孤树",
      category: "landscape",
      categoryLabel: "Landscape",
      style: "field",
      styleLabel: "Field",
      year: 2023,
      date: "Mar 11, 2023",
      location: "New Zealand, South Island",
      image: "../Home/assets/personal.png",
      alt: "A quiet minimal landscape fragment",
      description: "一棵树站在坡地上，周围没有多余的声音。",
      camera: "FUJIFILM X-T30",
      lens: "35mm f/2",
      aperture: "f/5.6",
      shutter: "1/250s",
      iso: "200",
      featured: false,
      layout: "normal"
    }
  ];

  const personalPhotos = [
    {
      id: "personal-afternoon-desk",
      title: "午后的桌面",
      category: "personal",
      categoryLabel: "Personal",
      style: "diary",
      styleLabel: "Diary",
      year: 2024,
      date: "Apr 12, 2024",
      time: "15:27",
      place: "Shenzhen, China",
      location: "Shenzhen, China",
      image: "../Home/assets/personal.png",
      alt: "A quiet desk with notebook and glasses in afternoon light",
      description: "光从窗外斜进来，落在笔记本和旧相机上。那段安静的时间里，什么都不急。",
      camera: "Leica M6",
      lens: "Summicron 50mm",
      film: "Kodak Portra 400",
      aperture: "f/2.0",
      shutter: "1/125s",
      iso: "400",
      featured: true,
      layout: "normal"
    },
    {
      id: "personal-station",
      title: "车站",
      category: "personal",
      categoryLabel: "Personal",
      style: "travel",
      styleLabel: "Travel",
      year: 2023,
      date: "Oct 03, 2023",
      time: "09:40",
      place: "Guangzhou, China",
      location: "Guangzhou, China",
      image: "../Home/assets/city-humanity.png",
      alt: "Two people waiting near a station window",
      description: "候车厅里的人来来去去，短暂停留也变成一段旅途的开头。",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      film: "Digital",
      aperture: "f/4",
      shutter: "1/250s",
      iso: "320",
      featured: false,
      layout: "normal"
    },
    {
      id: "personal-morning-hand",
      title: "清晨的手",
      category: "personal",
      categoryLabel: "Personal",
      style: "close-moments",
      styleLabel: "Close Moments",
      year: 2024,
      date: "Mar 18, 2024",
      time: "08:16",
      place: "On the way",
      location: "On the way",
      image: "../Home/assets/photographer.png",
      alt: "A close quiet morning moment with a cup",
      description: "车窗边的咖啡还有余温，手停在那里，像是在等下一段风景。",
      camera: "Leica M6",
      lens: "Summicron 50mm",
      film: "Kodak Portra 400",
      aperture: "f/2.8",
      shutter: "1/250s",
      iso: "400",
      featured: false,
      layout: "normal"
    },
    {
      id: "personal-glass-vase",
      title: "玻璃花瓶",
      category: "personal",
      categoryLabel: "Personal",
      style: "objects",
      styleLabel: "Objects",
      year: 2023,
      date: "Dec 07, 2023",
      time: "16:05",
      place: "Shenzhen, China",
      location: "Shenzhen, China",
      image: "../Home/assets/personal.png",
      alt: "A small object study in quiet indoor light",
      description: "桌面上的物件没有被摆拍，只是在光线里刚好形成一小段秩序。",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      film: "Digital",
      aperture: "f/2.8",
      shutter: "1/160s",
      iso: "500",
      featured: false,
      layout: "normal"
    },
    {
      id: "personal-alley",
      title: "巷口",
      category: "personal",
      categoryLabel: "Personal",
      style: "diary",
      styleLabel: "Diary",
      year: 2024,
      date: "May 06, 2024",
      time: "17:48",
      place: "Shenzhen, China",
      location: "Shenzhen, China",
      image: "../Project/assets/project-city-rhythm.png",
      alt: "A quiet alley with bicycle and plants",
      description: "回家路上经过的巷口，植物、墙面和车轮都保持着很低的声音。",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      film: "Digital",
      aperture: "f/4",
      shutter: "1/320s",
      iso: "400",
      featured: false,
      layout: "normal"
    },
    {
      id: "personal-window-shadow",
      title: "窗边的光影",
      category: "personal",
      categoryLabel: "Personal",
      style: "quiet-light",
      styleLabel: "Quiet Light",
      year: 2024,
      date: "Feb 22, 2024",
      time: "14:12",
      place: "Shenzhen, China",
      location: "Shenzhen, China",
      image: "../Project/assets/project-seen-silence.png",
      alt: "Curtain shadow and quiet window light",
      description: "窗帘投下很轻的影子，房间里只剩下时间缓慢移动的痕迹。",
      camera: "Leica M6",
      lens: "Summicron 50mm",
      film: "Kodak Portra 400",
      aperture: "f/2.8",
      shutter: "1/125s",
      iso: "400",
      featured: false,
      layout: "normal"
    },
    {
      id: "personal-roadside",
      title: "旅途的路口",
      category: "personal",
      categoryLabel: "Personal",
      style: "travel",
      styleLabel: "Travel",
      year: 2023,
      date: "Aug 19, 2023",
      time: "11:34",
      place: "Northern California, USA",
      location: "Northern California, USA",
      image: "../Project/assets/project-edges-light.png",
      alt: "A quiet road near the sea during travel",
      description: "路口停下来的那几秒，风、海面和路牌一起留在了画面里。",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      film: "Digital",
      aperture: "f/5.6",
      shutter: "1/500s",
      iso: "200",
      featured: false,
      layout: "normal"
    },
    {
      id: "personal-notes",
      title: "随手的笔记",
      category: "personal",
      categoryLabel: "Personal",
      style: "diary",
      styleLabel: "Diary",
      year: 2024,
      date: "Jun 09, 2024",
      time: "21:18",
      place: "Shenzhen, China",
      location: "Shenzhen, China",
      image: "../Home/assets/photographer.png",
      alt: "Notebook and personal objects on a bed",
      description: "很多记录不是为了完整，只是为了让某个念头有地方停一下。",
      camera: "Leica M6",
      lens: "Summicron 50mm",
      film: "Kodak Portra 400",
      aperture: "f/2",
      shutter: "1/60s",
      iso: "400",
      featured: false,
      layout: "normal"
    },
    {
      id: "personal-room-corner",
      title: "房间一角",
      category: "personal",
      categoryLabel: "Personal",
      style: "quiet-light",
      styleLabel: "Quiet Light",
      year: 2023,
      date: "Nov 14, 2023",
      time: "16:40",
      place: "Shenzhen, China",
      location: "Shenzhen, China",
      image: "../Home/assets/personal.png",
      alt: "A quiet room corner with soft window light",
      description: "角落里的椅子和光线形成一段很小的日常秩序。",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      film: "Digital",
      aperture: "f/2.8",
      shutter: "1/125s",
      iso: "640",
      featured: false,
      layout: "normal"
    },
    {
      id: "personal-reading-water",
      title: "阅读与水",
      category: "personal",
      categoryLabel: "Personal",
      style: "objects",
      styleLabel: "Objects",
      year: 2024,
      date: "Jul 01, 2024",
      time: "13:05",
      place: "Shenzhen, China",
      location: "Shenzhen, China",
      image: "../Home/assets/photographer.png",
      alt: "A book, glass and quiet desk objects",
      description: "一本书、一杯水和一段短暂的午后，足够组成一张私人手账。",
      camera: "Leica M6",
      lens: "Summicron 50mm",
      film: "Kodak Portra 400",
      aperture: "f/2.8",
      shutter: "1/125s",
      iso: "400",
      featured: false,
      layout: "normal"
    }
  ];

  const cmsData = window.cmsStore?.getPublicData?.();
  const cmsRender = window.cmsRender;
  const cmsHydrated = hydrateCmsPhotography(cmsData);

  function hydrateCmsPhotography(data) {
    if (!data || !cmsRender) {
      return { categoryFilters: [], pageTitle: "", updated: "", location: "" };
    }

    cmsRender.applySeo("photography", {
      ogImage: data.gallery?.[0]?.image || "../Project/assets/project-edges-light.png"
    });
    cmsRender.applyChrome("photography");

    const categories = Array.isArray(data.categories) ? data.categories : [];
    const categoryBySlug = new Map(categories.map((category) => [cmsRender.slugify(category.name || category.id), category]));
    const cmsPhotos = (Array.isArray(data.gallery) ? data.gallery : []).map((photo) => {
      const categoryId = photo.categoryId || cmsRender.slugify(photo.category || "");
      const category = categoryBySlug.get(categoryId);
      const label = category?.name || photo.categoryLabel || photo.category || "Photography";
      return {
        id: photo.id || `photo-${Date.now()}`,
        title: photo.title || "Untitled Photo",
        category: categoryId,
        categoryLabel: label,
        style: cmsRender.slugify(label),
        styleLabel: label,
        year: Number(photo.year) || new Date().getFullYear(),
        date: photo.date || String(photo.year || ""),
        location: photo.location || data.settings?.globalInfo?.defaultLocation || "",
        image: photo.image || cmsRender.defaultImage,
        alt: photo.altText || photo.title || "Photography archive image",
        description: photo.description || "",
        camera: photo.camera || "-",
        lens: photo.lens || "-",
        aperture: photo.aperture || "-",
        shutter: photo.shutter || "-",
        iso: photo.iso || "-",
        featured: Boolean(photo.featured),
        layout: photo.layout || "normal"
      };
    });

    if (cmsPhotos.length) {
      photos.splice(0, photos.length, ...cmsPhotos);
      portraitPhotos.splice(0, portraitPhotos.length, ...cmsPhotos.filter((photo) => photo.category === "portrait"));
      landscapePhotos.splice(0, landscapePhotos.length, ...cmsPhotos.filter((photo) => photo.category === "landscape"));
      personalPhotos.splice(0, personalPhotos.length, ...cmsPhotos.filter((photo) => photo.category === "personal"));
    }

    const categoryGrid = document.querySelector(".category-grid");
    if (categoryGrid && categories.length) {
      categoryGrid.innerHTML = categories
        .map((category) => {
          const slug = cmsRender.slugify(category.name || category.id);
          const count = Number(category.photoCount) || cmsPhotos.filter((photo) => photo.category === slug).length;
          return `
            <button class="category-card" type="button" data-filter-shortcut="${cmsRender.escapeAttr(slug)}">
              <img
                src="${cmsRender.escapeAttr(category.coverImage || cmsRender.defaultImage)}"
                alt="${cmsRender.escapeAttr(category.coverAlt || `${category.name || "Photography"} collection preview`)}"
                width="287"
                height="218"
                loading="lazy"
                decoding="async"
              />
              <span>
                <strong>${cmsRender.escapeHtml(category.name || "Photography")}</strong>
                <small>${cmsRender.escapeHtml(count)} images</small>
              </span>
            </button>
          `;
        })
        .join("");
    }

    return {
      categoryFilters: categories.map((category) => ({
        value: cmsRender.slugify(category.name || category.id),
        label: category.name || "Photography"
      })),
      pageTitle: `${data.settings?.globalInfo?.brandName || "WonG"} - Photography`,
      updated: data.settings?.homeHero?.updated || "",
      location: data.settings?.globalInfo?.defaultLocation || data.profile?.location || ""
    };
  }

  const state = {
    pageMode: "archive",
    filter: "all",
    portraitFilter: "all",
    landscapeFilter: "all",
    personalFilter: "all",
    sort: "latest",
    view: "grid",
    activeId: "coastline",
    favoriteIds: new Set(["coastline", "window-light"])
  };
  let galleryRefreshFrame = 0;

  const galleryGrid = document.querySelector("[data-gallery-grid]");
  const featuredRail = document.querySelector("[data-featured-rail]");
  const emptyState = document.querySelector("[data-empty-state]");
  const detailPanel = document.querySelector("[data-detail-panel]");
  const detailClose = document.querySelector("[data-detail-close]");
  const page = document.querySelector("[data-page-mode]");
  const pageTitle = document.querySelector("[data-page-title]");
  const pagePath = document.querySelector("[data-page-path]");
  const heroDescription = document.querySelector("[data-hero-description]");
  const archiveNo = document.querySelector("[data-archive-no]");
  const archiveUpdated = document.querySelector("[data-archive-updated]");
  const archiveLocation = document.querySelector("[data-archive-location]");
  const stampTitle = document.querySelector("[data-stamp-title]");
  const stampNo = document.querySelector("[data-stamp-no]");
  const filterGroup = document.querySelector("[data-filter-group]");
  const shortcutButtons = Array.from(document.querySelectorAll("[data-filter-shortcut]"));
  const sortSelect = document.querySelector("[data-sort]");
  const viewButtons = Array.from(document.querySelectorAll("[data-view]"));
  const featuredPrev = document.querySelector("[data-featured-prev]");
  const featuredNext = document.querySelector("[data-featured-next]");
  const focusFeatured = document.querySelector("[data-focus-featured]");
  const photoPrev = document.querySelector("[data-photo-prev]");
  const photoNext = document.querySelector("[data-photo-next]");
  const detailStar = document.querySelector("[data-detail-star]");
  const revealSections = Array.from(document.querySelectorAll(".reveal-section"));

  const archiveFilters = [
    { value: "all", label: "All" },
    { value: "featured", label: "Featured" },
    { value: "portrait", label: "Portrait" },
    { value: "landscape", label: "Landscape" },
    { value: "city-humanity", label: "City Humanity" },
    { value: "personal", label: "Personal" }
  ];

  const portraitFilters = [
    { value: "all", label: "All" },
    { value: "studio", label: "Studio" },
    { value: "street", label: "Street" },
    { value: "natural-light", label: "Natural Light" },
    { value: "close-up", label: "Close-up" }
  ];

  const landscapeFilters = [
    { value: "all", label: "All" },
    { value: "mountain", label: "Mountain" },
    { value: "coast", label: "Coast" },
    { value: "forest", label: "Forest" },
    { value: "night", label: "Night" },
    { value: "weather", label: "Weather" }
  ];

  const personalFilters = [
    { value: "all", label: "Diary" },
    { value: "travel", label: "Travel" },
    { value: "close-moments", label: "Close Moments" },
    { value: "objects", label: "Objects" },
    { value: "quiet-light", label: "Quiet Light" }
  ];

  if (cmsHydrated.categoryFilters.length) {
    archiveFilters.splice(2, archiveFilters.length - 2, ...cmsHydrated.categoryFilters);
  }

  if (!galleryGrid || !featuredRail || !detailPanel) {
    return;
  }

  function isPortraitMode() {
    return state.pageMode === "portrait";
  }

  function isLandscapeMode() {
    return state.pageMode === "landscape";
  }

  function isPersonalMode() {
    return state.pageMode === "personal";
  }

  function isCollectionMode() {
    return isPortraitMode() || isLandscapeMode() || isPersonalMode();
  }

  function getSourcePhotos() {
    if (isPortraitMode()) {
      return portraitPhotos;
    }

    if (isLandscapeMode()) {
      return landscapePhotos;
    }

    if (isPersonalMode()) {
      return personalPhotos;
    }

    return photos;
  }

  function enterPortraitMode() {
    state.pageMode = "portrait";
    state.portraitFilter = "all";
    state.view = "grid";
    state.activeId = "portrait-window-light";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function enterLandscapeMode() {
    state.pageMode = "landscape";
    state.landscapeFilter = "all";
    state.view = "grid";
    state.activeId = "landscape-mountain-clouds";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function enterPersonalMode() {
    state.pageMode = "personal";
    state.personalFilter = "all";
    state.view = "grid";
    state.activeId = "personal-afternoon-desk";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderPageShell() {
    const portrait = isPortraitMode();
    const landscape = isLandscapeMode();
    const personal = isPersonalMode();
    const collection = isCollectionMode();
    const title = portrait ? "Portrait" : landscape ? "Landscape" : personal ? "Personal" : "Photography";
    const coverImage = document.querySelector(".portrait-cover img");
    const coverCaption = document.querySelector(".portrait-cover figcaption");
    const rail = document.querySelector(".portrait-rail");
    const railLabel = document.querySelector(".portrait-rail p");
    const railNo = document.querySelector(".portrait-rail strong");

    page?.classList.toggle("is-portrait-mode", portrait);
    page?.classList.toggle("is-landscape-mode", landscape);
    page?.classList.toggle("is-personal-mode", personal);
    page?.classList.toggle("is-collection-mode", collection);
    page?.setAttribute("data-page-mode", portrait ? "portrait" : landscape ? "landscape" : personal ? "personal" : "archive");
    document.body.classList.toggle("portrait-mode", portrait);
    document.body.classList.toggle("landscape-mode", landscape);
    document.body.classList.toggle("personal-mode", personal);
    document.body.classList.toggle("collection-mode", collection);
    document.title = portrait
      ? "WonG - Portrait Photography"
      : landscape
        ? "WonG - Landscape Photography"
        : personal
          ? "WonG - Personal Photography"
          : cmsHydrated.pageTitle || "WonG - Photography";

    if (pageTitle) {
      pageTitle.textContent = title;
    }

    if (pagePath) {
      pagePath.textContent = portrait
        ? "/photography/portrait"
        : landscape
          ? "/photography/landscape"
          : personal
            ? "/photography/personal"
            : "/photography";
    }

    if (heroDescription) {
      if (portrait) {
        heroDescription.innerHTML = "关于人的凝视与表达。<br />在自然光与真实情境中，记录神情、气质与情绪的微妙变化。<br />每一次快门，都是一次真诚的对话。";
      } else if (landscape) {
        heroDescription.innerHTML = "风景是时间的容器。<br />我在远方的地平线、变化的天气与地形中，<br />寻找光线与沉默的关系，记录自然的节奏与呼吸。";
      } else if (personal) {
        heroDescription.innerHTML = "一些私人的片段与日常的光。<br />旅行的记忆、生活的细节、安静的物件、<br />靠近的时刻。<br />这是属于我自己的视觉手账。";
      } else {
        heroDescription.innerHTML = "A visual archive of moments and places.<br />Images from different journeys and seasons, recorded in natural light.";
      }
    }

    if (archiveNo) {
      archiveNo.textContent = portrait ? "04" : landscape ? "05" : personal ? "07" : "03";
    }

    if (archiveUpdated) {
      archiveUpdated.textContent = cmsHydrated.updated || "May 2025";
    }

    if (archiveLocation) {
      archiveLocation.textContent = cmsHydrated.location || "Shenzhen, China";
    }

    if (stampTitle) {
      stampTitle.innerHTML = portrait
        ? "WonG Archive<br />Portrait Collection"
        : landscape
          ? "WonG Archive<br />Landscape Collection"
          : personal
            ? "WonG Archive<br />Personal Collection"
            : "WonG Archive<br />Photography Collection";
    }

    if (stampNo) {
      stampNo.textContent = portrait ? "04" : landscape ? "05" : personal ? "07" : "03";
    }

    if (rail) {
      rail.setAttribute(
        "aria-label",
        portrait
          ? "Portrait collection marker"
          : landscape
            ? "Landscape collection marker"
            : personal
              ? "Personal collection marker"
              : "Collection marker"
      );
    }

    if (railLabel) {
      railLabel.textContent = portrait ? "Portrait Collection" : landscape ? "Landscape Collection" : personal ? "Personal Collection" : "";
    }

    if (railNo) {
      railNo.textContent = portrait ? "04" : landscape ? "05" : personal ? "07" : "";
    }

    if (coverImage) {
      coverImage.src = landscape ? "../Home/assets/landscape.png" : personal ? "../Home/assets/personal.png" : "../Project/assets/project-seen-silence.png";
      coverImage.alt = landscape
        ? "Landscape collection cover with mountains and a lake under soft cloudy light"
        : personal
          ? "Personal collection cover with quiet daily light"
          : "Portrait collection cover in soft natural window light";
    }

    if (coverCaption) {
      coverCaption.innerHTML = landscape
        ? "<span><b>Place</b> New Zealand, South Island</span><span><b>Year</b> 2024</span><span><b>Season</b> Autumn</span><span><b>Light</b> Soft Light</span>"
        : personal
          ? "<span><b>Place</b> Shenzhen</span><span><b>Month</b> Apr 2024</span><span><b>Light</b> Quiet Light</span>"
          : "<span><b>Year</b> 2024</span><span><b>Light</b> Natural Light</span><span><b>Location</b> Shenzhen, China</span>";
    }
  }

  function getFilteredPhotos() {
    const sourcePhotos = getSourcePhotos();
    const filtered = sourcePhotos.filter((photo) => {
      const activeFilter = isPortraitMode()
        ? state.portraitFilter
        : isLandscapeMode()
          ? state.landscapeFilter
          : isPersonalMode()
            ? state.personalFilter
            : state.filter;

      if (activeFilter === "all") {
        return true;
      }

      if (!isCollectionMode() && activeFilter === "featured") {
        return photo.featured;
      }

      if (isCollectionMode()) {
        return photo.style === activeFilter;
      }

      return photo.category === activeFilter;
    });

    return filtered.sort((a, b) => {
      if (state.sort === "oldest") {
        return a.year - b.year || sourcePhotos.indexOf(a) - sourcePhotos.indexOf(b);
      }

      if (state.sort === "title") {
        return a.title.localeCompare(b.title);
      }

      return b.year - a.year || sourcePhotos.indexOf(a) - sourcePhotos.indexOf(b);
    });
  }

  function getActiveIndex(list) {
    const index = list.findIndex((photo) => photo.id === state.activeId);
    return index >= 0 ? index : 0;
  }

  function setFilter(nextFilter) {
    if (!isCollectionMode() && nextFilter === "portrait") {
      enterPortraitMode();
      return;
    }

    if (!isCollectionMode() && nextFilter === "landscape") {
      enterLandscapeMode();
      return;
    }

    if (!isCollectionMode() && nextFilter === "personal") {
      enterPersonalMode();
      return;
    }

    if (isPortraitMode()) {
      state.portraitFilter = nextFilter;
    } else if (isLandscapeMode()) {
      state.landscapeFilter = nextFilter;
    } else if (isPersonalMode()) {
      state.personalFilter = nextFilter;
    } else {
      state.filter = nextFilter;
    }

    const visible = getFilteredPhotos();

    if (!visible.some((photo) => photo.id === state.activeId) && visible[0]) {
      state.activeId = visible[0].id;
    }

    render();
  }

  function setActivePhoto(photoId, shouldFocusDetail) {
    state.activeId = photoId;
    detailPanel.hidden = false;
    render();

    if (shouldFocusDetail) {
      detailPanel.focus?.({ preventScroll: true });
    }
  }

  function toggleFavorite(photoId) {
    if (state.favoriteIds.has(photoId)) {
      state.favoriteIds.delete(photoId);
    } else {
      state.favoriteIds.add(photoId);
    }

    render();
  }

  function makePhotoButton(photo, index) {
    const button = document.createElement("button");
    button.className = `photo-card ${photo.layout === "wide" ? "is-wide" : ""} ${photo.layout === "tall" ? "is-tall" : ""}`.trim();
    button.type = "button";
    button.dataset.photoId = photo.id;
    button.style.animationDelay = `${Math.min(index, 8) * 45}ms`;

    if (photo.id === state.activeId) {
      button.classList.add("is-active");
      button.setAttribute("aria-current", "true");
    }

    button.innerHTML = `
      <span class="photo-card-image">
        <img src="${photo.image}" alt="${photo.alt}" width="386" height="242" loading="lazy" decoding="async" />
      </span>
      <span class="photo-card-body">
        <span class="photo-card-title">${photo.title}</span>
        ${
          isCollectionMode()
            ? `<span class="photo-card-meta">${photo.styleLabel}</span><span class="photo-card-year">${photo.year}</span>`
            : `<span class="photo-card-meta">${photo.categoryLabel} / ${photo.year}</span>`
        }
        <span class="photo-card-star ${state.favoriteIds.has(photo.id) ? "is-favorite" : ""}" aria-hidden="true">
          ${state.favoriteIds.has(photo.id) ? "&#9733;" : "&#9734;"}
        </span>
      </span>
    `;

    button.addEventListener("click", () => {
      setActivePhoto(photo.id, false);
    });

    button.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveActive(-1, true);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveActive(1, true);
      }
    });

    return button;
  }

  function renderGallery() {
    const visiblePhotos = getFilteredPhotos();
    galleryGrid.classList.add("is-refreshing");
    galleryGrid.classList.toggle("is-list", state.view === "list");
    galleryGrid.replaceChildren(...visiblePhotos.map((photo, index) => makePhotoButton(photo, index)));
    window.cancelAnimationFrame(galleryRefreshFrame);
    galleryRefreshFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        galleryGrid.classList.remove("is-refreshing");
      });
    });

    if (emptyState) {
      emptyState.hidden = visiblePhotos.length > 0;
    }
  }

  function renderFeaturedRail() {
    const featuredPhotos = photos.filter((photo) => photo.featured);
    const nodes = featuredPhotos.map((photo) => {
      const button = document.createElement("button");
      button.className = "featured-thumb";
      button.type = "button";
      button.dataset.featuredId = photo.id;
      button.setAttribute("aria-label", `Open ${photo.title}`);

      if (photo.id === state.activeId) {
        button.classList.add("is-active");
      }

      button.innerHTML = `<img src="${photo.image}" alt="${photo.alt}" width="386" height="242" loading="lazy" decoding="async" />`;
      button.addEventListener("click", () => setActivePhoto(photo.id, false));
      return button;
    });

    featuredRail.replaceChildren(...nodes);
  }

  function setDetailSpec(labelSelector, valueSelector, label, value) {
    const labelNode = detailPanel.querySelector(labelSelector);
    const valueNode = detailPanel.querySelector(valueSelector);

    if (labelNode) {
      labelNode.textContent = label;
    }

    if (valueNode) {
      valueNode.textContent = value || "-";
    }
  }

  function renderDetailSpecs(photo) {
    const extraSpecs = Array.from(detailPanel.querySelectorAll(".detail-extra-spec"));

    if (isPersonalMode()) {
      extraSpecs.forEach((item) => {
        item.hidden = false;
      });

      setDetailSpec("[data-detail-label-camera]", "[data-detail-camera]", "Date", photo.date);
      setDetailSpec("[data-detail-label-lens]", "[data-detail-lens]", "Time", photo.time);
      setDetailSpec("[data-detail-label-aperture]", "[data-detail-aperture]", "Place", photo.place || photo.location);
      setDetailSpec("[data-detail-label-shutter]", "[data-detail-shutter]", "Camera", photo.camera);
      setDetailSpec("[data-detail-label-iso]", "[data-detail-iso]", "Lens", photo.lens);
      setDetailSpec("[data-detail-label-date]", "[data-detail-date]", "Film", photo.film || "Digital");
      setDetailSpec("[data-detail-label-extra-one]", "[data-detail-extra-one]", "Aperture", photo.aperture);
      setDetailSpec("[data-detail-label-extra-two]", "[data-detail-extra-two]", "Shutter", photo.shutter);
      setDetailSpec("[data-detail-label-extra-three]", "[data-detail-extra-three]", "ISO", photo.iso);
      return;
    }

    extraSpecs.forEach((item) => {
      item.hidden = true;
    });

    setDetailSpec("[data-detail-label-camera]", "[data-detail-camera]", "Camera", photo.camera);
    setDetailSpec("[data-detail-label-lens]", "[data-detail-lens]", "Lens", photo.lens);
    setDetailSpec("[data-detail-label-aperture]", "[data-detail-aperture]", "Aperture", photo.aperture);
    setDetailSpec("[data-detail-label-shutter]", "[data-detail-shutter]", "Shutter", photo.shutter);
    setDetailSpec("[data-detail-label-iso]", "[data-detail-iso]", "ISO", photo.iso);
    setDetailSpec("[data-detail-label-date]", "[data-detail-date]", "Date", photo.date);
  }

  function renderDetail() {
    const visiblePhotos = getFilteredPhotos();
    const sourcePhotos = getSourcePhotos();
    const activePhoto = sourcePhotos.find((photo) => photo.id === state.activeId) || visiblePhotos[0] || sourcePhotos[0];

    if (!activePhoto) {
      detailPanel.hidden = true;
      return;
    }

    const activeVisibleIndex = Math.max(0, visiblePhotos.findIndex((photo) => photo.id === activePhoto.id));
    const countTotal = visiblePhotos.length || sourcePhotos.length;
    const isFavorite = state.favoriteIds.has(activePhoto.id);

    detailPanel.querySelector("[data-detail-image]").src = activePhoto.image;
    detailPanel.querySelector("[data-detail-image]").alt = activePhoto.alt;
    detailPanel.querySelector("[data-detail-title]").textContent = activePhoto.title;
    detailPanel.querySelector("[data-detail-meta]").innerHTML = `
      <span>${isCollectionMode() ? activePhoto.styleLabel : activePhoto.categoryLabel}</span>
      <span>${activePhoto.year}</span>
      ${isPersonalMode() ? "" : `<span>${activePhoto.location}</span>`}
    `;
    detailPanel.querySelector("[data-detail-description]").textContent = activePhoto.description;
    renderDetailSpecs(activePhoto);
    detailPanel.querySelector("[data-detail-count]").textContent = `${activeVisibleIndex + 1} / ${countTotal}`;

    if (detailStar) {
      detailStar.classList.toggle("is-favorite", isFavorite);
      detailStar.innerHTML = `<span aria-hidden="true">${isFavorite ? "&#9733;" : "&#9734;"}</span>`;
      detailStar.setAttribute(
        "aria-label",
        `${isFavorite ? "Remove selected photo from" : "Mark selected photo as"} favorite`
      );
    }
  }

  function renderControls() {
    if (filterGroup) {
      const label = filterGroup.querySelector("span") || document.createElement("span");
      label.textContent = "Filter:";
      const activeFilter = isPortraitMode()
        ? state.portraitFilter
        : isLandscapeMode()
          ? state.landscapeFilter
          : isPersonalMode()
            ? state.personalFilter
            : state.filter;
      const filters = isPortraitMode()
        ? portraitFilters
        : isLandscapeMode()
          ? landscapeFilters
          : isPersonalMode()
            ? personalFilters
            : archiveFilters;
      const buttons = filters.map((filter) => {
        const button = document.createElement("button");
        const isActive = filter.value === activeFilter;
        button.type = "button";
        button.dataset.filter = filter.value;
        button.textContent = filter.label;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
        return button;
      });

      filterGroup.replaceChildren(label, ...buttons);
    }

    viewButtons.forEach((button) => {
      const isActive = button.dataset.view === state.view;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (sortSelect) {
      sortSelect.value = state.sort;
    }
  }

  function render() {
    renderPageShell();
    renderControls();
    renderFeaturedRail();
    renderGallery();
    renderDetail();
  }

  function moveActive(direction, shouldFocusCard) {
    const visiblePhotos = getFilteredPhotos();

    if (!visiblePhotos.length) {
      return;
    }

    const activeIndex = getActiveIndex(visiblePhotos);
    const nextIndex = (activeIndex + direction + visiblePhotos.length) % visiblePhotos.length;
    state.activeId = visiblePhotos[nextIndex].id;
    detailPanel.hidden = false;
    render();

    if (shouldFocusCard) {
      const activeCard = galleryGrid.querySelector(`[data-photo-id="${state.activeId}"]`);
      activeCard?.focus({ preventScroll: true });
    }
  }

  if (revealSections.length && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );

    revealSections.forEach((section) => revealObserver.observe(section));
  } else {
    revealSections.forEach((section) => section.classList.add("is-visible"));
  }

  filterGroup?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");

    if (button) {
      setFilter(button.dataset.filter);
    }
  });

  shortcutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const shortcut = button.dataset.filterShortcut;

      if (shortcut === "portrait") {
        enterPortraitMode();
        return;
      }

      if (shortcut === "landscape") {
        enterLandscapeMode();
        return;
      }

      if (shortcut === "personal") {
        enterPersonalMode();
        return;
      }

      setFilter(shortcut);
      document.querySelector(".gallery-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  sortSelect?.addEventListener("change", () => {
    state.sort = sortSelect.value;
    render();
  });

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  featuredPrev?.addEventListener("click", () => {
    featuredRail.scrollBy({ left: -240, behavior: "smooth" });
    moveActive(-1, false);
  });

  featuredNext?.addEventListener("click", () => {
    featuredRail.scrollBy({ left: 240, behavior: "smooth" });
    moveActive(1, false);
  });

  focusFeatured?.addEventListener("click", () => {
    const featuredPhoto = photos.find((photo) => photo.featured) || photos[0];
    setActivePhoto(featuredPhoto.id, false);
  });

  photoPrev?.addEventListener("click", () => moveActive(-1, false));
  photoNext?.addEventListener("click", () => moveActive(1, false));

  detailStar?.addEventListener("click", () => {
    toggleFavorite(state.activeId);
  });

  detailClose?.addEventListener("click", () => {
    detailPanel.hidden = true;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !detailPanel.hidden) {
      detailPanel.hidden = true;
    }
  });

  galleryGrid.addEventListener("click", (event) => {
    const star = event.target.closest(".photo-card-star");

    if (!star) {
      return;
    }

    const card = event.target.closest("[data-photo-id]");
    if (card) {
      event.stopPropagation();
      toggleFavorite(card.dataset.photoId);
    }
  });

  render();
})();
