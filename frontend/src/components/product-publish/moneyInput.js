import { useLayoutEffect, useRef } from 'react'

export const MAX_GNF_DIGITS = 15

export function sanitizeGNFAmount(value, maxDigits = MAX_GNF_DIGITS) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, maxDigits)
  return digits.replace(/^0+(?=\d)/, '')
}

export function formatGNFInput(value) {
  const amount = sanitizeGNFAmount(value)
  if (!amount) return ''

  return new Intl.NumberFormat('fr-GN', {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(Number(amount))
}

function countDigits(value) {
  return (value.match(/\d/g) || []).length
}

function caretOffsetForDigitPosition(formattedValue, digitPosition) {
  if (digitPosition <= 0) return 0

  let seenDigits = 0
  for (let index = 0; index < formattedValue.length; index += 1) {
    if (/\d/.test(formattedValue[index])) {
      seenDigits += 1
      if (seenDigits === digitPosition) return index + 1
    }
  }

  return formattedValue.length
}

/**
 * Keeps the form state numeric while showing grouped GNF amounts. The caret is
 * restored by digit position so inserting or deleting within an amount stays
 * predictable instead of jumping to the end of the field.
 */
export function useFormattedGNFInput({ value, onValueChange, maxDigits = MAX_GNF_DIGITS }) {
  const inputRef = useRef(null)
  const pendingDigitPositionRef = useRef(null)
  const numericValue = sanitizeGNFAmount(value, maxDigits)
  const displayValue = formatGNFInput(numericValue)

  useLayoutEffect(() => {
    const input = inputRef.current
    const digitPosition = pendingDigitPositionRef.current
    if (!input || digitPosition === null) return
    if (document.activeElement !== input) {
      pendingDigitPositionRef.current = null
      return
    }

    const nextOffset = caretOffsetForDigitPosition(displayValue, digitPosition)
    input.setSelectionRange(nextOffset, nextOffset)
    pendingDigitPositionRef.current = null
  }, [displayValue])

  function onChange(event) {
    const typedValue = event.target.value
    const caret = event.target.selectionStart ?? typedValue.length
    const nextValue = sanitizeGNFAmount(typedValue, maxDigits)
    pendingDigitPositionRef.current = Math.min(countDigits(typedValue.slice(0, caret)), nextValue.length)
    onValueChange(nextValue)
  }

  return { inputRef, displayValue, onChange }
}
