import { config } from '../config';
import { getAuthToken } from './auth';
import type { WalletData, Transaction } from '../types';

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
    const token = getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-api-key': config.X_API_KEY,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

export const walletService = {
    async getWalletData(): Promise<WalletData> {
        const headers = getAuthHeaders();
        const response = await fetch(`${config.API_BASE_URI}/api/planner/wallet`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to fetch wallet data');
        }

        return response.json();
    },

    async getTransactions(): Promise<{ success: boolean; transactions: Transaction[] }> {
        const headers = getAuthHeaders();
        const response = await fetch(`${config.API_BASE_URI}/api/planner/transactions`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to fetch transactions');
        }

        return response.json();
    },

    async getBankDetails(): Promise<{ success: boolean; bankDetails: import('../types').BankDetail[] }> {
        const headers = getAuthHeaders();
        const response = await fetch(`${config.API_BASE_URI}/api/planner/bank-details`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to fetch bank details');
        }

        return response.json();
    },

    async setPrimaryBankDetail(id: string): Promise<{ success: boolean }> {
        const headers = getAuthHeaders();
        const response = await fetch(`${config.API_BASE_URI}/api/planner/bank-details/${id}/primary`, {
            method: 'PATCH',
            headers,
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to set primary bank detail');
        }

        return response.json();
    },

    async withdraw(amount: number): Promise<{ success: boolean; message: string }> {
        const headers = getAuthHeaders();
        const response = await fetch(`${config.API_BASE_URI}/api/planner/withdraw`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ amount }),
        });

        const data = await response.json();
        if (!response.ok) {
            // Throw the whole response data so we can check the message in the component
            throw data;
        }

        return data;
    },

    async getWithdrawals(): Promise<import('../types').WithdrawalRequestsResponse> {
        const headers = getAuthHeaders();
        const response = await fetch(`${config.API_BASE_URI}/api/planner/withdrawals`, {
            headers,
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to fetch withdrawals');
        } 
        return response.json();
    },

    async addBankDetails(data: any): Promise<{ success: boolean; bankDetail: import('../types').BankDetail }> {
        const headers = getAuthHeaders();
        const response = await fetch(`${config.API_BASE_URI}/api/planner/bank-details`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to add bank details');
        }

        return response.json();
    },
};
