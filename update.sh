#!/bin/bash
git add .
git commit -m "Auto update: $(date)"
git push origin main
echo "Update successfully pushed to GitHub and Render!"
