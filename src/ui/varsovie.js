/**
 * Composant : ambiance Varsovie
 * Skyline pixel art + nuages + cigognes + tram qui passe
 * À insérer en tant que background décoratif dans les écrans qui le veulent
 */

export function bgVarsovieHtml(opts = {}) {
  const { withTram = true, withStorks = true, opacity = 1 } = opts
  const op = opacity !== 1 ? `style="opacity: ${opacity}"` : ''

  return `
    <div class="bg-varsovie" ${op}>
      <div class="skyline">${skylineSvg()}</div>
      ${withTram ? tramSvg() : ''}
      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
      <div class="cloud cloud-3"></div>
      ${withStorks ? '<div class="stork stork-1"></div><div class="stork stork-2"></div>' : ''}
    </div>
  `
}

/**
 * SVG de la skyline Varsovie
 * Vieille ville colorée + Palais de la Culture + blocs communistes
 */
function skylineSvg() {
  return `
    <svg viewBox="0 0 380 240" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <!-- Vieille ville (Rynek) -->
      <rect x="0" y="155" width="32" height="85" fill="#e8c878"/>
      <polygon points="0,155 16,140 32,155" fill="#7a4848"/>
      <rect x="6" y="165" width="6" height="8" fill="#3a2a3e"/>
      <rect x="20" y="165" width="6" height="8" fill="#3a2a3e"/>
      <rect x="6" y="180" width="6" height="8" fill="#3a2a3e"/>
      <rect x="20" y="180" width="6" height="8" fill="#3a2a3e"/>
      <rect x="6" y="195" width="6" height="8" fill="#3a2a3e"/>
      <rect x="20" y="195" width="6" height="8" fill="#3a2a3e"/>
      <rect x="11" y="215" width="10" height="25" fill="#7a4848"/>

      <rect x="32" y="160" width="34" height="80" fill="#d4a4a4"/>
      <polygon points="32,160 49,142 66,160" fill="#a02828"/>
      <rect x="36" y="170" width="6" height="8" fill="#3a2a3e"/>
      <rect x="48" y="170" width="6" height="8" fill="#3a2a3e"/>
      <rect x="60" y="170" width="6" height="8" fill="#3a2a3e"/>
      <rect x="36" y="185" width="6" height="8" fill="#3a2a3e"/>
      <rect x="48" y="185" width="6" height="8" fill="#3a2a3e"/>
      <rect x="60" y="185" width="6" height="8" fill="#3a2a3e"/>
      <rect x="36" y="200" width="6" height="8" fill="#3a2a3e"/>
      <rect x="48" y="200" width="6" height="8" fill="#3a2a3e"/>
      <rect x="60" y="200" width="6" height="8" fill="#3a2a3e"/>

      <rect x="66" y="158" width="30" height="82" fill="#8aa890"/>
      <polygon points="66,158 81,140 96,158" fill="#5a4858"/>
      <rect x="70" y="168" width="6" height="8" fill="#3a2a3e"/>
      <rect x="84" y="168" width="6" height="8" fill="#3a2a3e"/>
      <rect x="70" y="183" width="6" height="8" fill="#3a2a3e"/>
      <rect x="84" y="183" width="6" height="8" fill="#3a2a3e"/>
      <rect x="70" y="198" width="6" height="8" fill="#3a2a3e"/>
      <rect x="84" y="198" width="6" height="8" fill="#3a2a3e"/>
      <!-- Enseigne PIWO -->
      <rect x="68" y="210" width="26" height="14" fill="#a02828"/>
      <rect x="70" y="212" width="2" height="10" fill="#f0c860"/>
      <rect x="74" y="212" width="2" height="10" fill="#f0c860"/>
      <rect x="78" y="212" width="2" height="10" fill="#f0c860"/>
      <rect x="82" y="212" width="2" height="10" fill="#f0c860"/>
      <rect x="86" y="212" width="2" height="10" fill="#f0c860"/>
      <rect x="90" y="212" width="2" height="10" fill="#f0c860"/>

      <rect x="96" y="162" width="32" height="78" fill="#7a98b0"/>
      <polygon points="96,162 112,144 128,162" fill="#7a4848"/>
      <rect x="100" y="172" width="6" height="8" fill="#3a2a3e"/>
      <rect x="114" y="172" width="6" height="8" fill="#3a2a3e"/>
      <rect x="100" y="187" width="6" height="8" fill="#3a2a3e"/>
      <rect x="114" y="187" width="6" height="8" fill="#3a2a3e"/>
      <rect x="100" y="202" width="6" height="8" fill="#3a2a3e"/>
      <rect x="114" y="202" width="6" height="8" fill="#3a2a3e"/>

      <!-- PALAIS DE LA CULTURE -->
      <rect x="135" y="190" width="80" height="50" fill="#a8a6a0"/>
      <rect x="145" y="160" width="60" height="30" fill="#a8a6a0"/>
      <rect x="160" y="100" width="30" height="60" fill="#a8a6a0"/>
      <rect x="165" y="80" width="20" height="20" fill="#a8a6a0"/>
      <rect x="172" y="55" width="6" height="25" fill="#6a6a68"/>
      <rect x="174" y="40" width="2" height="15" fill="#6a6a68"/>
      <rect x="173" y="35" width="4" height="4" fill="#f0c860"/>

      <g fill="#3a2a3e">
        <rect x="164" y="105" width="2" height="3"/><rect x="170" y="105" width="2" height="3"/>
        <rect x="178" y="105" width="2" height="3"/><rect x="184" y="105" width="2" height="3"/>
        <rect x="164" y="115" width="2" height="3"/><rect x="170" y="115" width="2" height="3"/>
        <rect x="178" y="115" width="2" height="3"/><rect x="184" y="115" width="2" height="3"/>
        <rect x="164" y="125" width="2" height="3"/><rect x="170" y="125" width="2" height="3"/>
        <rect x="178" y="125" width="2" height="3"/><rect x="184" y="125" width="2" height="3"/>
        <rect x="164" y="135" width="2" height="3"/><rect x="170" y="135" width="2" height="3"/>
        <rect x="178" y="135" width="2" height="3"/><rect x="184" y="135" width="2" height="3"/>
        <rect x="164" y="145" width="2" height="3"/><rect x="170" y="145" width="2" height="3"/>
        <rect x="178" y="145" width="2" height="3"/><rect x="184" y="145" width="2" height="3"/>
        <rect x="164" y="155" width="2" height="3"/><rect x="170" y="155" width="2" height="3"/>
        <rect x="178" y="155" width="2" height="3"/><rect x="184" y="155" width="2" height="3"/>
      </g>
      <g fill="#3a2a3e">
        <rect x="148" y="168" width="3" height="4"/><rect x="156" y="168" width="3" height="4"/>
        <rect x="164" y="168" width="3" height="4"/><rect x="172" y="168" width="3" height="4"/>
        <rect x="180" y="168" width="3" height="4"/><rect x="188" y="168" width="3" height="4"/>
        <rect x="196" y="168" width="3" height="4"/>
        <rect x="148" y="178" width="3" height="4"/><rect x="156" y="178" width="3" height="4"/>
        <rect x="164" y="178" width="3" height="4"/><rect x="172" y="178" width="3" height="4"/>
        <rect x="180" y="178" width="3" height="4"/><rect x="188" y="178" width="3" height="4"/>
        <rect x="196" y="178" width="3" height="4"/>
      </g>
      <g fill="#3a2a3e">
        <rect x="140" y="200" width="3" height="6"/><rect x="148" y="200" width="3" height="6"/>
        <rect x="156" y="200" width="3" height="6"/><rect x="186" y="200" width="3" height="6"/>
        <rect x="194" y="200" width="3" height="6"/><rect x="202" y="200" width="3" height="6"/>
        <rect x="208" y="200" width="3" height="6"/>
        <rect x="166" y="200" width="14" height="20"/>
      </g>

      <!-- Blocs communistes -->
      <rect x="220" y="180" width="40" height="60" fill="#d8d6d0"/>
      <g fill="#3a2a3e">
        <rect x="224" y="186" width="4" height="5"/><rect x="232" y="186" width="4" height="5"/>
        <rect x="240" y="186" width="4" height="5"/><rect x="248" y="186" width="4" height="5"/>
        <rect x="254" y="186" width="4" height="5"/>
        <rect x="224" y="195" width="4" height="5"/><rect x="232" y="195" width="4" height="5"/>
        <rect x="240" y="195" width="4" height="5"/><rect x="248" y="195" width="4" height="5"/>
        <rect x="254" y="195" width="4" height="5"/>
        <rect x="224" y="204" width="4" height="5"/><rect x="232" y="204" width="4" height="5"/>
        <rect x="240" y="204" width="4" height="5"/><rect x="248" y="204" width="4" height="5"/>
        <rect x="254" y="204" width="4" height="5"/>
        <rect x="224" y="213" width="4" height="5"/><rect x="232" y="213" width="4" height="5"/>
        <rect x="240" y="213" width="4" height="5"/><rect x="248" y="213" width="4" height="5"/>
        <rect x="254" y="213" width="4" height="5"/>
        <rect x="224" y="222" width="4" height="5"/><rect x="232" y="222" width="4" height="5"/>
        <rect x="240" y="222" width="4" height="5"/><rect x="248" y="222" width="4" height="5"/>
        <rect x="254" y="222" width="4" height="5"/>
      </g>

      <!-- Tour moderne -->
      <rect x="265" y="150" width="35" height="90" fill="#7a98b0"/>
      <g fill="#dcc8b8">
        <rect x="270" y="158" width="8" height="3"/><rect x="282" y="158" width="8" height="3"/>
        <rect x="270" y="166" width="8" height="3"/><rect x="282" y="166" width="8" height="3"/>
        <rect x="270" y="174" width="8" height="3"/><rect x="282" y="174" width="8" height="3"/>
        <rect x="270" y="182" width="8" height="3"/><rect x="282" y="182" width="8" height="3"/>
        <rect x="270" y="190" width="8" height="3"/><rect x="282" y="190" width="8" height="3"/>
        <rect x="270" y="198" width="8" height="3"/><rect x="282" y="198" width="8" height="3"/>
        <rect x="270" y="206" width="8" height="3"/><rect x="282" y="206" width="8" height="3"/>
        <rect x="270" y="214" width="8" height="3"/><rect x="282" y="214" width="8" height="3"/>
        <rect x="270" y="222" width="8" height="3"/><rect x="282" y="222" width="8" height="3"/>
      </g>

      <!-- Bloc brique -->
      <rect x="305" y="190" width="40" height="50" fill="#a8746a"/>
      <g fill="#3a2a3e">
        <rect x="310" y="195" width="4" height="5"/><rect x="320" y="195" width="4" height="5"/>
        <rect x="330" y="195" width="4" height="5"/><rect x="340" y="195" width="4" height="5"/>
        <rect x="310" y="205" width="4" height="5"/><rect x="320" y="205" width="4" height="5"/>
        <rect x="330" y="205" width="4" height="5"/><rect x="340" y="205" width="4" height="5"/>
        <rect x="310" y="215" width="4" height="5"/><rect x="320" y="215" width="4" height="5"/>
        <rect x="330" y="215" width="4" height="5"/><rect x="340" y="215" width="4" height="5"/>
        <rect x="310" y="225" width="4" height="5"/><rect x="320" y="225" width="4" height="5"/>
        <rect x="330" y="225" width="4" height="5"/><rect x="340" y="225" width="4" height="5"/>
      </g>

      <!-- Bâtiment droite -->
      <rect x="350" y="200" width="30" height="40" fill="#8aa890"/>
      <g fill="#3a2a3e">
        <rect x="355" y="206" width="4" height="5"/><rect x="365" y="206" width="4" height="5"/>
        <rect x="372" y="206" width="4" height="5"/>
        <rect x="355" y="216" width="4" height="5"/><rect x="365" y="216" width="4" height="5"/>
        <rect x="372" y="216" width="4" height="5"/>
        <rect x="355" y="226" width="4" height="5"/><rect x="365" y="226" width="4" height="5"/>
        <rect x="372" y="226" width="4" height="5"/>
      </g>

      <!-- Sol/rails -->
      <rect x="0" y="232" width="380" height="8" fill="#6a6a68"/>
      <rect x="0" y="234" width="380" height="1" fill="#3a2a3e"/>
      <rect x="0" y="237" width="380" height="1" fill="#3a2a3e"/>
    </svg>
  `
}

/**
 * SVG du tram qui passe
 */
function tramSvg() {
  return `
    <svg class="tram-anim" viewBox="0 0 80 30" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <rect x="2" y="6" width="76" height="18" fill="#d04848"/>
      <rect x="0" y="4" width="80" height="3" fill="#a02828"/>
      <rect x="35" y="0" width="2" height="4" fill="#3a2a3e"/>
      <rect x="30" y="-2" width="14" height="2" fill="#3a2a3e"/>
      <rect x="6" y="10" width="9" height="9" fill="#c0c8d0"/>
      <rect x="17" y="10" width="9" height="9" fill="#c0c8d0"/>
      <rect x="28" y="10" width="9" height="9" fill="#c0c8d0"/>
      <rect x="39" y="10" width="9" height="9" fill="#c0c8d0"/>
      <rect x="50" y="10" width="9" height="9" fill="#c0c8d0"/>
      <rect x="61" y="10" width="9" height="9" fill="#c0c8d0"/>
      <rect x="74" y="14" width="4" height="3" fill="#f0c860"/>
      <rect x="2" y="14" width="4" height="3" fill="#dcc8b8"/>
      <rect x="8" y="24" width="6" height="4" fill="#3a2a3e"/>
      <rect x="22" y="24" width="6" height="4" fill="#3a2a3e"/>
      <rect x="52" y="24" width="6" height="4" fill="#3a2a3e"/>
      <rect x="66" y="24" width="6" height="4" fill="#3a2a3e"/>
      <rect x="36" y="6" width="8" height="3" fill="#f0c860"/>
    </svg>
  `
}

/**
 * Mini skyline (pour les cadres avatar etc)
 */
export function miniSkylineHtml() {
  return `
    <svg class="mini-skyline" viewBox="0 0 148 50" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <rect x="0" y="30" width="20" height="20" fill="#a8746a"/>
      <rect x="20" y="25" width="22" height="25" fill="#d4a4a4"/>
      <rect x="42" y="20" width="18" height="30" fill="#e8c878"/>
      <rect x="65" y="10" width="10" height="40" fill="#a8a6a0"/>
      <rect x="68" y="2" width="4" height="8" fill="#a8a6a0"/>
      <rect x="75" y="22" width="20" height="28" fill="#a8a6a0"/>
      <rect x="95" y="28" width="20" height="22" fill="#7a98b0"/>
      <rect x="115" y="32" width="33" height="18" fill="#8aa890"/>
      <rect x="0" y="48" width="148" height="2" fill="#6a6a68"/>
    </svg>
  `
}

/**
 * Items flottants (pierogi, vodka, żubr)
 */
export function floatingItemsHtml() {
  return `
    <svg class="float-item float-pierogi" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <path d="M 3 8 Q 3 4 8 4 Q 13 4 13 8 L 11 11 L 5 11 Z" fill="#f0d090" stroke="#3a2a3e" stroke-width="0.5"/>
      <rect x="4" y="8" width="1" height="3" fill="#a87858"/>
      <rect x="6" y="7" width="1" height="4" fill="#a87858"/>
      <rect x="8" y="7" width="1" height="4" fill="#a87858"/>
      <rect x="10" y="7" width="1" height="4" fill="#a87858"/>
      <rect x="12" y="8" width="1" height="3" fill="#a87858"/>
      <rect x="6" y="5" width="3" height="1" fill="#f8e4b0"/>
      <rect x="7" y="9" width="1" height="1" fill="#d04848"/>
      <rect x="9" y="9" width="1" height="1" fill="#d04848"/>
      <rect x="8" y="10" width="1" height="1" fill="#d04848"/>
    </svg>
    <svg class="float-item float-vodka" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <rect x="6" y="0" width="4" height="2" fill="#5a4858"/>
      <rect x="6" y="2" width="4" height="3" fill="#a8a6a0"/>
      <rect x="3" y="5" width="10" height="10" fill="#a8a6a0"/>
      <rect x="3" y="7" width="10" height="3" fill="#fbf3e0"/>
      <rect x="3" y="10" width="10" height="3" fill="#d04848"/>
      <rect x="5" y="8" width="1" height="1" fill="#3a2a3e"/>
      <rect x="7" y="8" width="1" height="1" fill="#3a2a3e"/>
      <rect x="9" y="8" width="1" height="1" fill="#3a2a3e"/>
      <rect x="11" y="8" width="1" height="1" fill="#3a2a3e"/>
      <rect x="4" y="5" width="1" height="9" fill="#d8d6d0"/>
    </svg>
    <svg class="float-item float-zubr" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <rect x="3" y="6" width="10" height="6" fill="#5a4858"/>
      <rect x="2" y="4" width="5" height="4" fill="#5a4858"/>
      <rect x="2" y="3" width="1" height="1" fill="#3a2a3e"/>
      <rect x="6" y="3" width="1" height="1" fill="#3a2a3e"/>
      <rect x="3" y="5" width="1" height="1" fill="#f0c860"/>
      <rect x="4" y="12" width="2" height="3" fill="#3a2a3e"/>
      <rect x="10" y="12" width="2" height="3" fill="#3a2a3e"/>
      <rect x="13" y="7" width="1" height="2" fill="#5a4858"/>
      <rect x="13" y="9" width="2" height="2" fill="#3a2a3e"/>
    </svg>
  `
}
