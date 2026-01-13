'use client'

import { authClient } from '@/lib/auth';
import { useRouter } from "next/navigation";

interface ReviewButtonProps {
    dealId: number;
    isOpen: boolean;
    onToggle: () => void;
}

export function ReviewButton({ dealId, isOpen, onToggle }: ReviewButtonProps) {
    const { data: session } = authClient.useSession();
    const router = useRouter();

    const handleClick = () => {
        if (!session) {
            router.push('/login');
        } else {
            onToggle();
        }
    };

    return (
        <button onClick={handleClick}>
            {isOpen ? 'Cancel' : 'Review'}
        </button>
    );
}