import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../src/firebaseConfig';

const COLECAO = 'observacoesDia';

export async function fetchObservacoesPorDia(): Promise<Record<string, string>> {
  const snap = await getDocs(collection(db, COLECAO));
  const map: Record<string, string> = {};
  snap.forEach((d) => {
    const texto = d.data()?.texto;
    if (typeof texto === 'string') {
      map[d.id] = texto;
    }
  });
  return map;
}

export async function saveObservacaoDia(dataKey: string, texto: string): Promise<void> {
  await setDoc(doc(db, COLECAO, dataKey), {
    texto,
    atualizadoEm: new Date().toISOString(),
  });
}
