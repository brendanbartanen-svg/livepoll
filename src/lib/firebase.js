import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  getDocs,
  writeBatch,
  increment,
  serverTimestamp,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyArH90Tryzmwsj60Cj3bCaFbF8eeZBN8rc',
  authDomain: 'livepoll-817c0.firebaseapp.com',
  projectId: 'livepoll-817c0',
  storageBucket: 'livepoll-817c0.firebasestorage.app',
  messagingSenderId: '822629735666',
  appId: '1:822629735666:web:2474e1e4e6e8e3e36cc46b',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// ---- Room management ----

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function createRoom(presenterPassword = '') {
  let code = generateRoomCode()
  let attempts = 0
  // Ensure unique code
  while (attempts < 10) {
    const existing = await getDoc(doc(db, 'rooms', code))
    if (!existing.exists()) break
    code = generateRoomCode()
    attempts++
  }

  await setDoc(doc(db, 'rooms', code), {
    createdAt: serverTimestamp(),
    activeQuestionId: null,
    showResults: false,
    status: 'open', // open | closed
    presenterPassword,
  })

  return code
}

export async function getRoom(roomCode) {
  const snap = await getDoc(doc(db, 'rooms', roomCode))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export function subscribeToRoom(roomCode, callback) {
  return onSnapshot(doc(db, 'rooms', roomCode), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() })
    }
  })
}

export async function updateRoom(roomCode, data) {
  await updateDoc(doc(db, 'rooms', roomCode), data)
}

// ---- Question management ----

export async function addQuestion(roomCode, questionData) {
  // questionData: { text, type: 'single'|'multi', options: string[] }
  const questionsRef = collection(db, 'rooms', roomCode, 'questions')
  const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
  const qDoc = {
    ...questionData,
    createdAt: serverTimestamp(),
    order: Date.now(),
  }
  await setDoc(doc(questionsRef, id), qDoc)
  return id
}

export function subscribeToQuestions(roomCode, callback) {
  return onSnapshot(collection(db, 'rooms', roomCode, 'questions'), (snap) => {
    const questions = []
    snap.forEach((d) => questions.push({ id: d.id, ...d.data() }))
    questions.sort((a, b) => (a.order || 0) - (b.order || 0))
    callback(questions)
  })
}

export async function deleteQuestion(roomCode, questionId) {
  await deleteDoc(doc(db, 'rooms', roomCode, 'questions', questionId))
}

export async function updateQuestion(roomCode, questionId, data) {
  await updateDoc(doc(db, 'rooms', roomCode, 'questions', questionId), data)
}

export async function clearResponses(roomCode, questionId) {
  const responsesRef = collection(db, 'rooms', roomCode, 'questions', questionId, 'responses')
  const snapshot = await getDocs(responsesRef)
  if (snapshot.empty) return
  const batch = writeBatch(db)
  snapshot.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

// ---- Response management ----

export async function submitResponse(roomCode, questionId, participantId, selectedOptions) {
  // selectedOptions: string[] (option text values)
  const responseRef = doc(
    db,
    'rooms',
    roomCode,
    'questions',
    questionId,
    'responses',
    participantId
  )
  await setDoc(responseRef, {
    selectedOptions,
    submittedAt: serverTimestamp(),
  })
}

export function subscribeToResponses(roomCode, questionId, callback) {
  return onSnapshot(
    collection(db, 'rooms', roomCode, 'questions', questionId, 'responses'),
    (snap) => {
      const responses = []
      snap.forEach((d) => responses.push({ id: d.id, ...d.data() }))
      callback(responses)
    }
  )
}
