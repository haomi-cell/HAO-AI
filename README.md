<div align="center">

<img src="https://capsule-render.vercel.app/api?type=soft&color=0:000000,50:0f2f0f,100:000000&height=180&section=header&text=HAO-AI&fontSize=46&fontColor=00ff41&fontAlignY=42&desc=%5B%20ai%20console%20%2F%2F%20serverless%20core%20%5D&descSize=13&descAlignY=62&animation=fadeIn" width="100%"/>

</div>

```bash
root@xMSHaomi:~# cat /projects/ai/README

  >> STATUS    : OPERATIONAL
  >> CORE      : serverless — no server to maintain
  >> UI        : dark console, mobile-ready
```

## ⚙ Architecture

```bash
root@xMSHaomi:~# tree

  ├── api/index.js     → chat endpoint (serverless)
  └── public/
      ├── index.html   → console UI
      ├── script.js    → client logic
      └── style.css    → dark theme
```

## 🚀 Deploy

```bash
root@xMSHaomi:~# vercel --prod
  ▲ done — console live
```

---
<div align="center"><sub>root@xMSHaomi — intelligence core</sub></div>
