import { useState, useCallback } from 'react';

interface ConfirmState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}

const initialState: ConfirmState = {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
};

export function useConfirm() {
    const [state, setState] = useState<ConfirmState>(initialState);

    const confirm = useCallback((title: string, message: string): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                title,
                message,
                onConfirm: () => {
                    setState(initialState);
                    resolve(true);
                },
            });
        });
    }, []);

    const handleCancel = useCallback(() => {
        setState(initialState);
    }, []);

    return {
        isOpen: state.isOpen,
        title: state.title,
        message: state.message,
        confirm,
        onConfirm: state.onConfirm,
        onCancel: handleCancel,
    };
}