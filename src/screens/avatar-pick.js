/**
 * Écran : choix du mode de création d'avatar
 */

import { state }          from '../state.js'
import { avatarLayersHtml } from '../ui/avatar.js'
import { bgVarsovieHtml }  from '../ui/varsovie.js'
import { icon }           from '../ui/icons.js'

export function renderAvatarPick() {
  if (state.myAvatar?.generatedImageUrl) return _renderConfirm()
  return _renderChoice(!!(state.userProfile?.name && state.userProfile?.avatar))
}

function _renderConfirm() {
  return `
    <section class="screen avatar-pick-screen" style="padding-top: 80px;">
      ${bgVarsovieHtml({ withTram: false, withStorks: false, opacity: 0.25 })}
      <button class="btn-back" data-action="resetGeneratedAvatar">
        ${icon('arrow_left', { size: 16 })}
      </button>
      <h2 class="title-screen">★ TON AVATAR IA ★</h2>
      <div class="ap-generated-preview">
        <div class="avatar lg">
          <div class="avatar-inner">${avatarLayersHtml(state.myAvatar, 'idle')}</div>
        </div>
        <p class="small light center" style="margin-top:14px;">Satisfait de ton look pixel art ?</p>
      </div>
      <div class="ap-actions">
        <button class="btn btn-cream btn-sm" data-action="retryGeneration">
          ${icon('retry', { size: 14 })} Réessayer
        </button>
        <button class="btn btn-red" data-action="confirmAvatar">
          ${icon('check', { size: 16 })} Valider ce look
        </button>
      </div>
    </section>
  `
}

function _card(cls, icon1, title, sub, actionOrNav) {
  const attr = actionOrNav.startsWith('data-') ? actionOrNav : `data-nav="${actionOrNav}"`
  return `
    <div class="ap-card ${cls}" ${attr}>
      <div class="ap-card-stripe"></div>
      <div class="ap-card-icon">${icon1}</div>
      <div class="ap-card-body">
        <div class="ap-card-title">${title}</div>
        <div class="ap-card-sub">${sub}</div>
      </div>
      <div class="ap-card-arrow">${icon('arrow_right', { size: 18 })}</div>
    </div>
  `
}

function _renderChoice(hasProfile) {
  return `
    <section class="screen avatar-pick-screen" style="padding-top: 80px;">
      ${bgVarsovieHtml({ withTram: false, withStorks: false, opacity: 0.25 })}
      <button class="btn-back" data-nav="home">${icon('arrow_left', { size: 16 })}</button>

      <h2 class="title-screen">★ TON AVATAR ★</h2>
      <p class="small light center mb" style="position:relative;z-index:5;">
        Comment tu veux créer ton perso ?
      </p>

      <div class="ap-cards">
        <div class="ap-card ap-card-ai" data-action="openAvatarGenerator">
          <div class="ap-card-stripe"></div>
          <div class="ap-card-icon">${icon('scan', { size: 36 })}</div>
          <div class="ap-card-body">
            <div class="ap-card-title">Scanne ma tête</div>
            <div class="ap-card-sub">L'IA pixelise ton visage (~15 sec)</div>
          </div>
          <div class="ap-card-arrow">${icon('arrow_right', { size: 18 })}</div>
        </div>

        <div class="ap-card ap-card-manual" data-nav="avatar">
          <div class="ap-card-stripe"></div>
          <div class="ap-card-icon">${icon('dice', { size: 36 })}</div>
          <div class="ap-card-body">
            <div class="ap-card-title">Créer manuellement</div>
            <div class="ap-card-sub">Skin, cheveux, yeux, accessoires</div>
          </div>
          <div class="ap-card-arrow">${icon('arrow_right', { size: 18 })}</div>
        </div>

        ${hasProfile ? `
        <div class="ap-card ap-card-profile" data-action="confirmAvatar">
          <div class="ap-card-stripe"></div>
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
          <div class="ap-card-arrow">${icon('arrow_right', { size: 18 })}</div>
        </div>
        ` : ''}
      </div>
    </section>
  `
}
