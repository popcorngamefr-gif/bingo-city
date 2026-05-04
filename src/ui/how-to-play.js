/**
 * How To Play — modale infographie présentant le jeu en 3 étapes.
 * Affichée depuis la home via le bouton "Comment jouer ?".
 */

import { icon } from './icons.js'

const STEPS = [
  {
    n: 1,
    iconName: 'plus',
    title: 'Crée ou rejoins',
    body: "Le Maître du Jeu (MJ) crée la partie et choisit les objets à trouver dans la ville. Les autres joueurs rejoignent avec un code à 4 caractères.",
    color: 'tram-red',
  },
  {
    n: 2,
    iconName: 'camera',
    title: 'Photographie',
    body: "Pendant la partie, ouvre l'œil. Quand tu repères un objet de ta liste — un tram rouge, un pierogi, une cigogne — tape la tuile et prends-le en photo.",
    color: 'tram-yellow',
  },
  {
    n: 3,
    iconName: 'trophy',
    title: 'Bingo !',
    body: "Le premier à compléter sa grille (ou avoir le plus de points à la fin du chrono) gagne. Le MJ peut terminer la partie quand il veut.",
    color: 'tram-red',
  },
]

export function openHowToPlay() {
  const root = document.getElementById('modal-root')
  if (!root) return

  root.innerHTML = `
    <div class="modal show how-modal">
      <div class="how-box">

        <div class="how-header">
          <div class="how-title">
            ${icon('sparkle', { size: 14 })} COMMENT JOUER ${icon('sparkle', { size: 14 })}
          </div>
          <p class="how-subtitle">Bingo Santé — Édition Varsovie</p>
        </div>

        <div class="how-steps">
          ${STEPS.map(s => `
            <div class="how-step how-step--${s.color}">
              <div class="how-step-num">${s.n}</div>
              <div class="how-step-icon">${icon(s.iconName, { size: 28 })}</div>
              <div class="how-step-content">
                <div class="how-step-title">${s.title}</div>
                <p class="how-step-body">${s.body}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="how-tip">
          ${icon('star', { size: 12 })}
          <span>Astuce : invite tes potes à scanner leur visage en avatar IA pour le fun.</span>
        </div>

        <div class="how-actions">
          <button class="btn btn-red" id="how-close-btn">
            ${icon('check', { size: 16 })} J'ai compris
          </button>
        </div>

      </div>
    </div>
  `

  document.getElementById('how-close-btn')?.addEventListener('click', closeHowToPlay)
  // Click sur le voile (pas sur le contenu) → ferme
  root.querySelector('.how-modal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('how-modal')) closeHowToPlay()
  })
}

export function closeHowToPlay() {
  const root = document.getElementById('modal-root')
  if (root) root.innerHTML = ''
}
