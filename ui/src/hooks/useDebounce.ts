import { useState, useEffect } from 'react';

function useDebounce(value: any, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

export default useDebounce;