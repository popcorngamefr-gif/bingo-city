/**
 * Firebase — initialisation
 * Un seul export de chaque service pour éviter les initialisations multiples.
 */

import { initializeApp } from 'firebase/app'
import { getAuth }       from 'firebase/auth'
import { getFirestore }  from 'firebase/firestore'
import { getStorage }    from 'firebase/storage'

const firebaseConfig = {
  apiKey:            'AIzaSyCbaAxrAzf7VLm2hd5raEPieO4RD6cuBsw',
  authDomain:        'bingo-sante.firebaseapp.com',
  projectId:         'bingo-sante',
  storageBucket:     'bingo-sante.firebasestorage.app',
  messagingSenderId: '512434614693',
  appId:             '1:512434614693:web:7a679d884635894bddb84c',
}

const app = initializeApp(firebaseConfig)

export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)
