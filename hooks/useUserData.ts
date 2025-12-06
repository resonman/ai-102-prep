"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
	doc,
	getDoc,
	setDoc,
	updateDoc,
	arrayUnion,
	arrayRemove,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

// 1. 定义用户数据的类型结构
type UserDataType = {
	practiceIndex: number;
	mistakes: string[];
	favorites: string[];
};

export function useUserData() {
	const [user, setUser] = useState<User | null>(null);

	// 2. 在 useState 中使用这个类型
	const [userData, setUserData] = useState<UserDataType>({
		practiceIndex: 0,
		mistakes: [],
		favorites: [],
	});

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			setUser(currentUser);
			if (currentUser) {
				const docRef = doc(db, "users", currentUser.uid);
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					// 3. 【修改点】这里把 'as any' 改成具体的类型断言 'as UserDataType'
					setUserData(docSnap.data() as UserDataType);
				} else {
					// 初始化新用户
					await setDoc(docRef, {
						practiceIndex: 0,
						mistakes: [],
						favorites: [],
					});
				}
			}
		});
		return () => unsubscribe();
	}, []);

	const saveProgress = async (index: number) => {
		if (!user) return;
		setUserData((prev) => ({ ...prev, practiceIndex: index }));
		await updateDoc(doc(db, "users", user.uid), { practiceIndex: index });
	};

	const toggleFavorite = async (questionId: string) => {
		if (!user) return;
		const isFav = userData.favorites.includes(questionId);
		const update = isFav ? arrayRemove(questionId) : arrayUnion(questionId);

		// 本地乐观更新
		setUserData((prev) => ({
			...prev,
			favorites: isFav
				? prev.favorites.filter((id) => id !== questionId)
				: [...prev.favorites, questionId],
		}));

		await updateDoc(doc(db, "users", user.uid), { favorites: update });
	};

	const addMistake = async (questionId: string) => {
		if (!user || userData.mistakes.includes(questionId)) return;
		setUserData((prev) => ({
			...prev,
			mistakes: [...prev.mistakes, questionId],
		}));
		await updateDoc(doc(db, "users", user.uid), {
			mistakes: arrayUnion(questionId),
		});
	};

	const removeMistake = async (questionId: string) => {
		if (!user) return;
		setUserData((prev) => ({
			...prev,
			mistakes: prev.mistakes.filter((id) => id !== questionId),
		}));
		await updateDoc(doc(db, "users", user.uid), {
			mistakes: arrayRemove(questionId),
		});
	};

	return {
		user,
		userData,
		saveProgress,
		toggleFavorite,
		addMistake,
		removeMistake,
	};
}
