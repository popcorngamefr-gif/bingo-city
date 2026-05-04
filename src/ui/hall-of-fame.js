/**
 * Hall of Fame — top scores mondiaux affiché sur la home.
 *
 * Charge les données async puis injecte dans le conteneur #home-hof
 * Affiche un état vide stylé si aucune partie n'a encore été jouée.
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
 * Charge et affiche le Hall of Fame dans #home-hof.
 * Idempotent : si déjà chargé, ne refait pas l'appel.
 */
export async function loadHallOfFame() {
  const container = document.getElementById('home-hof')
  if (!container) return
  if (container.dataset.loaded === 'true') return
  container.dataset.loaded = 'loading'

  let players = []
  try {
    const { getHallOfFame } = await import('../firebase/account.js')
    players = await getHallOfFame(TOP_N)
  } catch (err) {
    console.warn('[hof] load failed:', err)
  }

  // Ne tente pas d'injecter si l'user a navigué ailleurs entre-temps
  if (state.currentScreen !== 'home') return
  if (!container.isConnected) return

  container.dataset.loaded = 'true'

  if (players.length === 0) {
    container.innerHTML = _renderEmptyState()
    return
  }

  container.innerHTML = _renderList(players)
}

function _renderEmptyState() {
  return `
    <div class="hof-header">
      <span class="hof-deco">${icon('trophy', { size: 14 })}</span>
      <span class="hof-title">HALL OF FAME</span>
      <span class="hof-deco">${icon('trophy', { size: 14 })}</span>
    </div>
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
    <div class="hof-header">
      <span class="hof-deco">${icon('trophy', { size: 14 })}</span>
      <span class="hof-title">HALL OF FAME</span>
      <span class="hof-deco">${icon('trophy', { size: 14 })}</span>
    </div>
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
