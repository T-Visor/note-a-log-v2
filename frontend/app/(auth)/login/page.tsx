"use client";

import LoginForm from "@/components/login/login-form";
import SignupForm from "@/components/login/signup-form";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

const LoginPage = () => (
  <div
    className="
      dark:bg-gray-900
      h-screen w-screen overflow-auto
      flex flex-col justify-center items-center gap-3
    "
  >
    <Tabs 
      defaultValue="login" 
      className="w-full"
    >
      <div className="flex justify-center items-center">
        <TabsList className="dark:bg-gray-800">
          <TabsTrigger value="login" className="border-0">
            Login
          </TabsTrigger>
          <TabsTrigger value="signUp" className="border-0">
            Sign Up
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="login">
        <div className="flex justify-center items-center">
          <LoginForm />
        </div>
      </TabsContent>
      <TabsContent value="signUp">
        <div className="flex justify-center items-center">
          <SignupForm />
        </div>
      </TabsContent>
    </Tabs>
  </div>
);

export default LoginPage;