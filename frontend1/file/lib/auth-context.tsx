// // lib/auth-context.tsx
// "use client";

// import {
// 	createContext,
// 	useContext,
// 	useState,
// 	useEffect,
// 	type ReactNode,
// } from "react";
// import type { User } from "./types";
// import { adminLogin, staffLogin, setAccessToken } from "./api-client";
// // dataStore is still used for other parts, but auth will use API
// import { dataStore } from "./data-store";

// interface AuthContextType {
// 	user: User | null;
// 	login: (
// 		identifier: string,
// 		password: string,
// 		role?: "admin" | "employee" | "operator",
// 	) => Promise<boolean>;
// 	logout: () => void;
// 	isLoading: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
// 	const [user, setUser] = useState<User | null>(null);
// 	const [isLoading, setIsLoading] = useState(true);

// 	useEffect(() => {
// 		dataStore.init(); // Keep for other mock data, but consider removing later

// 		// Check for existing session from API token? For now, we can check localStorage for user object
// 		const savedUser = localStorage.getItem("tda_current_user");
// 		const token = localStorage.getItem("access_token");
// 		if (savedUser && token) {
// 			setUser(JSON.parse(savedUser));
// 		}
// 		setIsLoading(false);
// 	}, []);

// 	const login = async (
// 		identifier: string,
// 		password: string,
// 		role?: "admin" | "employee" | "operator",
// 	): Promise<boolean> => {
// 		try {
// 			let apiResponse;
// 			if (role === "admin") {
// 				apiResponse = await adminLogin(identifier, password);
// 			} else if (role === "employee") {
// 				// For employee, identifier is email (or CID? Backend expects email)
// 				// We'll assume email for now; if CID is needed, fetch staff by CID first
// 				apiResponse = await staffLogin(identifier, password);
// 			} else {
// 				return false;
// 			}

// 			// Transform backend user object to match frontend User type
// 			const backendUser = apiResponse.user;
// 			const frontendUser: User = {
// 				id: backendUser.id,
// 				username: backendUser.email, // or use email as username
// 				password: "", // never store
// 				role: role === "admin" ? "admin" : "employee",
// 				name: backendUser.name,
// 				email: backendUser.email,
// 				employeeId: backendUser.staffId || undefined,
// 				department: backendUser.department || undefined,
// 			};

// 			setUser(frontendUser);
// 			localStorage.setItem(
// 				"tda_current_user",
// 				JSON.stringify(frontendUser),
// 			);
// 			return true;
// 		} catch (error) {
// 			console.error("Login error:", error);
// 			return false;
// 		}
// 	};

// 	const logout = () => {
// 		setUser(null);
// 		localStorage.removeItem("tda_current_user");
// 		setAccessToken(null);
// 	};

// 	return (
// 		<AuthContext.Provider value={{ user, login, logout, isLoading }}>
// 			{children}
// 		</AuthContext.Provider>
// 	);
// }

// export function useAuth() {
// 	const context = useContext(AuthContext);
// 	if (context === undefined) {
// 		throw new Error("useAuth must be used within an AuthProvider");
// 	}
// 	return context;
// }
