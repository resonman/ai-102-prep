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

type UserDataType = {
  practiceIndex: number;
  mistakes: string[];
  favorites: string[];
};

export function useUserData() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // ✅ 新增：加载状态，默认为 true

  const [userData, setUserData] = useState<UserDataType>({
    practiceIndex: 0,
    mistakes: [],
    favorites: [],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // 如果用户已登录，去数据库查数据
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserDataType);
          } else {
            // 新用户，初始化数据库
            await setDoc(docRef, {
              practiceIndex: 0,
              mistakes: [],
              favorites: [],
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      // 无论是登录获取了数据，还是未登录使用默认数据，
      // 到这里都算“加载完成”了
      setLoading(false); // ✅ 数据就绪，关闭加载状态
    });
    return () => unsubscribe();
  }, []);

  const saveProgress = async (index: number) => {
    if (!user) return;
    // 乐观更新本地状态
    setUserData((prev) => ({ ...prev, practiceIndex: index }));
    // 异步更新云端
    await updateDoc(doc(db, "users", user.uid), { practiceIndex: index });
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

  // ✅ 导出 loading 状态
  return {
    user,
    userData,
    loading,
    saveProgress,
    toggleFavorite,
    addMistake,
    removeMistake,
  };
}
