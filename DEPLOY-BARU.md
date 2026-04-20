# Deploy Baru RRG Game Website

Folder ini ialah salinan bersih daripada projek fyp-math yang ada login, nota, makmal, kuiz dan game RRGs.

Yang sengaja tidak disalin:
- `.git`
- `.vercel`
- `node_modules`
- `dist`
- `.env.local`

## Cara buat repo GitHub baru

```bash
cd /Users/ahmadzaim/RRG-Game-Website
git init
git add .
git commit -m "Initial RRG game website"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO-BARU.git
git push -u origin main
```

## Cara deploy di Vercel

1. Pergi Vercel > Add New Project.
2. Pilih repo GitHub baru.
3. Tetapan:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Masukkan Environment Variables Firebase jika mahu login online. Rujuk `.env.example`.
5. Dalam Vercel Settings > Git, pastikan `Require Verified Commits` dimatikan jika commit belum verified.

## Local test

```bash
cd /Users/ahmadzaim/RRG-Game-Website
npm install
npm run dev
```

Buka link yang keluar, biasanya `http://localhost:5173/`.
