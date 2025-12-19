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

type UserSelection = string | string[] | Record<number, string> | null;

type UserDataType = {
  practiceIndex: number;
  mistakesIndex: number;
  favoritesIndex: number;
  mistakes: string[];
  favorites: string[];
  answers: Record<string, UserSelection>;
  // ✅ 新增：记录每道题做错的次数
  mistakeCounts: Record<string, number>;
};

export function useUserData() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [userData, setUserData] = useState<UserDataType>({
    practiceIndex: 0,
    mistakesIndex: 0,
    favoritesIndex: 0,
    mistakes: [],
    favorites: [],
    answers: {},
    mistakeCounts: {}, // ✅ 初始化为空对象
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              practiceIndex: data.practiceIndex || 0,
              mistakesIndex: data.mistakesIndex || 0,
              favoritesIndex: data.favoritesIndex || 0,
              mistakes: data.mistakes || [],
              favorites: data.favorites || [],
              answers: data.answers || {},
              mistakeCounts: data.mistakeCounts || {}, // ✅ 读取错题次数
            });
          } else {
            // 新用户初始化
            const initData = {
              practiceIndex: 0,
              mistakesIndex: 0,
              favoritesIndex: 0,
              mistakes: [],
              favorites: [],
              answers: {},
              mistakeCounts: {},
            };
            await setDoc(docRef, initData);
            setUserData(initData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ... saveProgress, saveMistakesProgress, saveFavoritesProgress 保持不变 ...
  const saveProgress = async (index: number) => {
    if (!user) return;
    setUserData((prev) => ({ ...prev, practiceIndex: index }));
    await updateDoc(doc(db, "users", user.uid), { practiceIndex: index });
  };

  const saveMistakesProgress = async (index: number) => {
    if (!user) return;
    setUserData((prev) => ({ ...prev, mistakesIndex: index }));
    await updateDoc(doc(db, "users", user.uid), { mistakesIndex: index });
  };

  const saveFavoritesProgress = async (index: number) => {
    if (!user) return;
    setUserData((prev) => ({ ...prev, favoritesIndex: index }));
    await updateDoc(doc(db, "users", user.uid), { favoritesIndex: index });
  };

  const toggleFavorite = async (questionId: string) => {
    if (!user) return;
    const isFav = userData.favorites.includes(questionId);
    const update = isFav ? arrayRemove(questionId) : arrayUnion(questionId);
    setUserData((prev) => ({
      ...prev,
      favorites: isFav
        ? prev.favorites.filter((id) => id !== questionId)
        : [...prev.favorites, questionId],
    }));
    await updateDoc(doc(db, "users", user.uid), { favorites: update });
  };

  // ✅ 核心修改：addMistake 现在会增加计数
  const addMistake = async (questionId: string) => {
    if (!user) return;

    // 1. 计算新的错误次数
    const currentCount = userData.mistakeCounts[questionId] || 0;
    const newCount = currentCount + 1;

    // 2. 更新本地状态
    setUserData((prev) => ({
      ...prev,
      // 如果还没在错题列表里，加进去；如果已经在，保持不变
      mistakes: prev.mistakes.includes(questionId)
        ? prev.mistakes
        : [...prev.mistakes, questionId],
      // 更新计数
      mistakeCounts: {
        ...prev.mistakeCounts,
        [questionId]: newCount,
      },
    }));

    // 3. 更新 Firebase
    // 使用 arrayUnion 确保不会重复添加 ID 到数组
    // 更新 mistakeCounts map 中的特定 ID
    await updateDoc(doc(db, "users", user.uid), {
      mistakes: arrayUnion(questionId),
      [`mistakeCounts.${questionId}`]: newCount,
    });
  };

  const removeMistake = async (questionId: string) => {
    if (!user) return;
    setUserData((prev) => ({
      ...prev,
      mistakes: prev.mistakes.filter((id) => id !== questionId),
      // 注意：这里我们通常不删除 counts，保留历史数据，或者你也可以选择删除
    }));
    await updateDoc(doc(db, "users", user.uid), {
      mistakes: arrayRemove(questionId),
    });
  };

  const recordAnswer = async (questionId: string, answer: UserSelection) => {
    if (!user) return;
    setUserData((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer },
    }));
    await updateDoc(doc(db, "users", user.uid), {
      [`answers.${questionId}`]: answer,
    });
  };

  return {
    user,
    userData,
    loading,
    saveProgress,
    saveMistakesProgress,
    saveFavoritesProgress,
    toggleFavorite,
    addMistake,
    removeMistake,
    recordAnswer,
  };
}
