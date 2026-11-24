import { describe, expect, it } from 'vitest';
import { isShortAnswerCorrect, normText } from '../lib/answerMatch';

describe('normText', () => {
  it('remove acentos, pontuação e espaços extras em minúsculas', () => {
    expect(normText('  Revolução   Francesa!  ')).toBe('revolucao francesa');
    expect(normText('Ácido Desoxirribonucleico (DNA).')).toBe('acido desoxirribonucleico dna');
  });
});

describe('isShortAnswerCorrect', () => {
  it('aceita resposta exata ignorando caixa, acentos e stopwords iniciais', () => {
    expect(isShortAnswerCorrect('A Fotossíntese', 'fotossintese')).toBe(true);
    expect(isShortAnswerCorrect('da Revolução Francesa', 'Revolucao Francesa')).toBe(true);
  });

  it('aceita variações de singular e plural', () => {
    expect(isShortAnswerCorrect('mitocondrias', 'mitocondria')).toBe(true);
    expect(isShortAnswerCorrect('elétrons', 'elétron')).toBe(true);
    expect(isShortAnswerCorrect('nucleos', 'nucleo')).toBe(true);
  });

  it('tolera pequenos erros de digitação proporcionais ao tamanho da palavra', () => {
    expect(isShortAnswerCorrect('fotossintse', 'fotossintese')).toBe(true);
    expect(isShortAnswerCorrect('mitocondra', 'mitocondria')).toBe(true);
    // Palavras muito curtas (<= 4 chars) não toleram erro de edição
    expect(isShortAnswerCorrect('RNA', 'DNA')).toBe(false);
    expect(isShortAnswerCorrect('ATP', 'ADP')).toBe(false);
  });

  it('respeita a lista de respostas alternativas (acceptList)', () => {
    expect(isShortAnswerCorrect('1789', 'Queda da Bastilha', ['1789', 'Revolução de 1789'])).toBe(true);
    expect(isShortAnswerCorrect('1889', 'Queda da Bastilha', ['1789'])).toBe(false);
  });

  it('aceita resposta correta contida em frase curta do aluno', () => {
    expect(isShortAnswerCorrect('foi a fotossíntese das plantas', 'fotossíntese')).toBe(true);
  });

  it('rejeita entradas vazias ou completamente incorretas', () => {
    expect(isShortAnswerCorrect('', 'mitose')).toBe(false);
    expect(isShortAnswerCorrect('   ', 'mitose')).toBe(false);
    expect(isShortAnswerCorrect('meiose', 'fotossíntese')).toBe(false);
  });
});
