/**
 * Écran : choix du mode de création d'avatar
 * Intercalé entre create/join et l'éditeur d'avatar.
 * Styles dans src/styles/screens.css
 */

import { state }          from '../state.js'
import { avatarLayersHtml } from '../ui/avatar.js'
import { bgVarsovieHtml }  from '../ui/varsovie.js'
import { icon }           from '../ui/icons.js'

export function renderAvatarPick() {
  const hasProfile  = !!(state.userProfile?.name && state.userProfile?.avatar)
  const hasGenerated = !!state.myAvatar?.generatedImageUrl

  // ── Mode confirmation post-génération IA ────────────────────────────────
  if (hasGenerated) {
    return `
      <section class="screen avatar-pick-screen">
        ${bgVarsovieHtml({ withTram: false, withStorks: false, opacity: 0.25 })}

        <button class="btn-back" data-action="resetGeneratedAvatar">${icon('arrow_left', { size: 16 })}</button>

        <h2 class="title-screen">★ TON AVATAR IA ★</h2>

        <div class="ap-generated-preview">
          <div class="avatar lg">
            <div class="avatar-inner">
              ${avatarLayersHtml(state.myAvatar, 'idle')}
            </div>
          </div>
          <p class="small light center" style="margin-top:10px;">
            Tu peux réessayer ou valider ce look.
          </p>
        </div>

        <div class="ap-actions">
          <button class="btn btn-ghost btn-sm" data-action="retryGeneration">
            ↺ Réessayer
          </button>
          <button class="btn btn-red" data-action="confirmAvatar">
            ✓ Valider ce look
          </button>
        </div>
      </section>
    `
  }

  // ── Mode choix ────────────────────────────────────────────────────────────
  return `
    <section class="screen avatar-pick-screen">
      ${bgVarsovieHtml({ withTram: false, withStorks: false, opacity: 0.25 })}

      <button class="btn-back" data-nav="home">${icon('arrow_left', { size: 16 })}</button>

      <h2 class="title-screen">★ TON AVATAR ★</h2>
      <p class="small light center mb" style="position:relative;z-index:5;">
        Comment tu veux créer ton perso ?
      </p>

      <div class="ap-cards">

        <!-- IA génération -->
        <div class="ap-card ap-card-ai" id="ap-ai-btn">
          <div class="ap-card-icon">📷</div>
          <div class="ap-card-body">
            <div class="ap-card-title">Scanne ma tête</div>
            <div class="ap-card-sub">L'IA pixelise ton visage en ~15 sec</div>
          </div>
          <div class="ap-card-arrow">→</div>
        </div>

        <!-- Manuel -->
        <div class="ap-card ap-card-manual" data-nav="avatar">
          <div class="ap-card-icon">🎲</div>
          <div class="ap-card-body">
            <div class="ap-card-title">Créer manuellement</div>
            <div class="ap-card-sub">Choisis skin, cheveux, yeux, accessoires</div>
          </div>
          <div class="ap-card-arrow">→</div>
        </div>

        <!-- Profil existant (conditionnel) -->
        ${hasProfile ? `
        <div class="ap-card ap-card-profile" data-action="confirmAvatar">
          <div class="ap-card-avatar">
            <div class="avatar xs">
              <div class="avatar-inner">
                ${avatarLayersHtml(state.userProfile.avatar, 'idle')}
              </div>
            </div>
          </div>
          <div class="ap-card-body">
            <div class="ap-card-title">Garder mon look</div>
            <div class="ap-card-sub">Réutiliser l'avatar de ${state.userProfile.name}</div>
          </div>
          <div class="ap-card-arrow">→</div>
        </div>
        ` : ''}

      </div>
    </section>
  `
}
