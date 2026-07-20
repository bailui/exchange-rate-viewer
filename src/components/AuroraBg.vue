<template>
  <div class="aurora-bg">
    <div class="aurora-blob a1"></div>
    <div class="aurora-blob a2"></div>
    <div class="aurora-blob a3"></div>
    <div class="aurora-blob a4"></div>
    <div class="noise"></div>
  </div>
</template>

<style lang="scss" scoped>
.aurora-bg {
  position:fixed; inset:0; overflow:hidden; pointer-events:none; z-index:0;
}

.aurora-blob {
  position:absolute; border-radius:50%; filter:blur(120px); opacity:.35;
}
.a1 {
  width:600px; height:600px; top:-200px; left:-100px;
  background: radial-gradient(circle, rgba(99,102,241,.5), transparent 70%);
  animation: aurora 20s ease-in-out infinite;
}
.a2 {
  width:500px; height:500px; top:30%; right:-150px;
  background: radial-gradient(circle, rgba(168,85,247,.45), transparent 70%);
  animation: aurora 25s ease-in-out infinite 5s;
}
.a3 {
  width:450px; height:450px; bottom:-100px; left:30%;
  background: radial-gradient(circle, rgba(236,72,153,.4), transparent 70%);
  animation: aurora 22s ease-in-out infinite 10s;
}
.a4 {
  width:350px; height:350px; top:60%; left:-80px;
  background: radial-gradient(circle, rgba(59,130,246,.35), transparent 70%);
  animation: aurora 18s ease-in-out infinite 7s;
}

.noise {
  position:absolute; inset:0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E");
  opacity:.4; mix-blend-mode:overlay;
}

@keyframes aurora {
  0% { transform:translate(0,0) rotate(0deg) scale(1) }
  25% { transform:translate(40px,-40px) rotate(90deg) scale(1.1) }
  50% { transform:translate(-30px,30px) rotate(180deg) scale(.9) }
  75% { transform:translate(-40px,-20px) rotate(270deg) scale(1.05) }
  100% { transform:translate(0,0) rotate(360deg) scale(1) }
}
</style>
