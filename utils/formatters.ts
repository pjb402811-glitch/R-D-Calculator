export const parseFormattedNumber = (value: string): number => {
    return parseFloat(value.replace(/,/g, '')) || 0;
};

export const formatNumberString = (value: string): string => {
    if (value.trim() === '') return '';
    const num = value.replace(/,/g, '');
    if (isNaN(parseFloat(num))) return value;
    
    const parts = num.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // For fixed leverage calculator, allow more decimal places
    const fractionalPart = parts[1] || '';

    return fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
};
