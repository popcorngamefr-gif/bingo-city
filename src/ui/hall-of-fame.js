/**
 * Hall of Fame — top scores mondiaux (modale).
 *
 * Ouvert depuis la home via le bouton "Hall of Fame".
 * Charge la liste async et affiche un état vide si aucune partie jouée.
 */

import { state }              from '../state.js'
import { icon }               from './icons.js'
import { avatarLayersHtml }   from './avatar.js'

const TOP_N = 10

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]))
}

/**
 * Ouvre la modale Hall of Fame.
 * Affiche un loader pendant le fetch puis remplace par la liste ou l'état vide.
 */
export function openHallOfFameModal() {
  const root = document.getElementById('modal-root')
  if (!root) return

  root.innerHTML = `
    <div class="modal show hof-modal">
      <div class="hof-box">
        <div class="hof-header">
          <span class="hof-deco">${icon('trophy', { size: 14 })}</span>
          <span class="hof-title">HALL OF FAME</span>
          <span class="hof-deco">${icon('trophy', { size: 14 })}</span>
        </div>
        <div class="hof-content" id="hof-content">
          <div class="hof-loading">
            <span class="btn-loader"></span>
            <span>Chargement…</span>
          </div>
        </div>
        <div class="hof-actions">
          <button class="btn btn-red" id="hof-close-btn">
            ${icon('check', { size: 16 })} Fermer
          </button>
        </div>
      </div>
    </div>
  `

  document.getElementById('hof-close-btn')?.addEventListener('click', closeHallOfFameModal)
  // Click sur le voile (pas sur le contenu) → ferme
  root.querySelector('.hof-modal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('hof-modal')) closeHallOfFameModal()
  })

  _loadAndRender()
}

export function closeHallOfFameModal() {
  const root = document.getElementById('modal-root')
  if (root) root.innerHTML = ''
}

async function _loadAndRender() {
  let players = []
  try {
    const { getHallOfFame } = await import('../firebase/account.js')
    players = await getHallOfFame(TOP_N)
  } catch (err) {
    console.warn('[hof] load failed:', err)
  }

  const container = document.getElementById('hof-content')
  if (!container) return  // Modale fermée entre-temps

  if (players.length === 0) {
    container.innerHTML = _renderEmptyState()
    return
  }

  container.innerHTML = _renderList(players)
}

function _renderEmptyState() {
  return `
    <div class="hof-empty">
      ${icon('hourglass', { size: 22 })}
      <p class="hof-empty-text">Aucune partie jouée pour le moment.<br>Lance la première !</p>
    </div>
  `
}

function _renderList(players) {
  const myKey = state.accountKey
  const medals = ['medal_gold', 'medal_silver', 'medal_bronze']

  return `
    <div class="hof-list">
      ${players.map((p, i) => {
        const isMe   = p.key === myKey
        const stats  = p.stats || {}
        const medal  = medals[i]
        return `
          <div class="hof-row ${isMe ? 'is-me' : ''}">
            <div class="hof-rank">
              ${medal ? icon(medal, { size: 22 }) : `<span class="hof-rank-num">${i + 1}</span>`}
            </div>
            <div class="avatar xs hof-avatar">
              <div class="avatar-inner">${avatarLayersHtml(p.avatar || {})}</div>
            </div>
            <div class="hof-info">
              <div class="hof-name">${escapeHtml(p.name || '—')}${isMe ? ' (toi)' : ''}</div>
              <div class="hof-meta">
                ${stats.totalGames || 0} partie${(stats.totalGames || 0) > 1 ? 's' : ''}
                · ${stats.wins || 0} victoire${(stats.wins || 0) > 1 ? 's' : ''}
                · ${stats.bingos || 0} bingo${(stats.bingos || 0) > 1 ? 's' : ''}
              </div>
            </div>
            <div class="hof-score">${stats.totalScore || 0}<span class="hof-score-unit">pts</span></div>
          </div>
        `
      }).join('')}
    </div>
    <div class="hof-footnote">
      ${icon('star', { size: 10 })} Avec un compte PIN, tes scores sont sauvegardés
    </div>
  `
}
