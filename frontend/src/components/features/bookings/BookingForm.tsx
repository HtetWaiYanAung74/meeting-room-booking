import { useState, FormEvent, useCallback } from 'react';
import { Button, Input } from '@/components/common';
import { formatDateTimeForInput, toISOString } from '@/utils/formatters';

interface BookingFormProps {
    onSubmit: (title: string, startTime: string, endTime: string) => Promise<void>;
}

interface FormErrors {
    title?: string;
    startTime?: string;
    endTime?: string;
}

export function BookingForm({ onSubmit }: BookingFormProps) {
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const minDateTime = formatDateTimeForInput();

    const validateField = useCallback((field: string, value: string): string | undefined => {
        switch (field) {
            case 'title':
                if (!value.trim()) {
                    return 'Booking title is required';
                }
                if (value.trim().length < 3) {
                    return 'Title must be at least 3 characters';
                }
                if (value.trim().length > 100) {
                    return 'Title must be less than 100 characters';
                }
                return undefined;
            
            case 'startTime':
                if (!value) {
                    return 'Start time is required';
                }
                if (new Date(value) < new Date()) {
                    return 'Start time cannot be in the past';
                }
                return undefined;
            
            case 'endTime':
                if (!value) {
                    return 'End time is required';
                }
                if (startTime && new Date(value) <= new Date(startTime)) {
                    return 'End time must be after start time';
                }
                return undefined;
            
            default:
                return undefined;
        }
    }, [startTime]);
    
    const validateForm = useCallback((): boolean => {
        const newErrors: FormErrors = {
            title: validateField('title', title),
            startTime: validateField('startTime', startTime),
            endTime: validateField('endTime', endTime),
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(Boolean);
    }, [title, startTime, endTime, validateField]);

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const value = field === 'title' ? title : field === 'startTime' ? startTime : endTime;
        setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    };

    const handleTitleChange = (value: string) => {
        setTitle(value);
        if (touched.title) {
            setErrors((prev) => ({ ...prev, title: validateField('title', value) }));
        }
    };

    const handleStartTimeChange = (value: string) => {
        setStartTime(value);
        if (touched.startTime) {
            setErrors((prev) => ({ ...prev, startTime: validateField('startTime', value) }));
        }
        if (endTime && touched.endTime) {
            const endTimeError = value && new Date(endTime) <= new Date(value)
                ? 'End time must be after start time'
                : undefined;
            setErrors((prev) => ({ ...prev, endTime: endTimeError }));
        }
    };

    const handleEndTimeChange = (value: string) => {
        setEndTime(value);
        if (touched.endTime) {
            setErrors((prev) => ({ ...prev, endTime: validateField('endTime', value) }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setTouched({ title: true, startTime: true, endTime: true });
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit(title.trim(), toISOString(startTime), toISOString(endTime));
            setTitle('');
            setStartTime('');
            setEndTime('');
            setErrors({});
            setTouched({});
        } catch {
            // Error handled by parent
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            <Input
                label="Booking Title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => handleBlur('title')}
                placeholder="e.g., Team Meeting, Interview, etc."
                disabled={isLoading}
                error={touched.title ? errors.title : undefined}
                required
                maxLength={100}
            />

            <div className="form-row mt-md">
                <Input
                    type="datetime-local"
                    label="Start Time"
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    onBlur={() => handleBlur('startTime')}
                    min={minDateTime}
                    disabled={isLoading}
                    error={touched.startTime ? errors.startTime : undefined}
                    required
                />
                <Input
                    type="datetime-local"
                    label="End Time"
                    value={endTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    onBlur={() => handleBlur('endTime')}
                    min={startTime || minDateTime}
                    disabled={isLoading}
                    error={touched.endTime ? errors.endTime : undefined}
                    required
                />
            </div>

            <Button type="submit" isLoading={isLoading} className="mt-md">
                Create Booking
            </Button>
        </form>
    );
}