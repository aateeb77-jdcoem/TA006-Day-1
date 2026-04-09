git init
git remote add origin https://github.com/aateeb77-jdcoem/TA006-Day-1.git
git fetch origin
git branch -M main
# Reset to remote main to align history, leaving local files intact
git reset --soft origin/main
git add static/app.js
git commit -m "Added fallback hack for Vercel deployment"
git push origin main
