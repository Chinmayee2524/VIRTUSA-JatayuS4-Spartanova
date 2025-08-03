import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, X } from "lucide-react";
import { insertUserSchema, loginSchema } from "@shared/schema";

const signupFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupFormSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

export default function Auth() {
  const [, navigate] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      age: 25,
      gender: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: () => {
      toast({ title: "Welcome back!", description: "You have been logged in successfully." });
      navigate("/");
    },
    onError: (error: any) => {
      toast({ 
        title: "Login failed", 
        description: error.message || "Invalid credentials", 
        variant: "destructive" 
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const { confirmPassword, ...signupData } = data;
      return apiRequest("POST", "/api/auth/signup", signupData);
    },
    onSuccess: () => {
      toast({ title: "Account created!", description: "Welcome to EcoChoice. Start discovering eco-friendly products!" });
      navigate("/");
    },
    onError: (error: any) => {
      toast({ 
        title: "Signup failed", 
        description: error.message || "Could not create account", 
        variant: "destructive" 
      });
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onSignupSubmit = (data: SignupFormData) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
      
      <Card className="w-full max-w-md relative z-50">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            onClick={() => navigate("/")}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center justify-center mb-2">
            <Leaf className="text-primary-600 text-2xl mr-2" />
            <span className="text-xl font-bold text-gray-900">EcoChoice</span>
          </div>
          
          <CardTitle className="text-2xl">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...loginForm.register("email")}
                  className="mt-1"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...loginForm.register("password")}
                  className="mt-1"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-600 mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary-600 hover:bg-primary-700"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...signupForm.register("name")}
                    className="mt-1"
                  />
                  {signupForm.formState.errors.name && (
                    <p className="text-sm text-red-600 mt-1">{signupForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="13"
                    max="120"
                    {...signupForm.register("age", { valueAsNumber: true })}
                    className="mt-1"
                  />
                  {signupForm.formState.errors.age && (
                    <p className="text-sm text-red-600 mt-1">{signupForm.formState.errors.age.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...signupForm.register("email")}
                  className="mt-1"
                />
                {signupForm.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={signupForm.watch("gender")} onValueChange={(value) => signupForm.setValue("gender", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                {signupForm.formState.errors.gender && (
                  <p className="text-sm text-red-600 mt-1">{signupForm.formState.errors.gender.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...signupForm.register("password")}
                  className="mt-1"
                />
                {signupForm.formState.errors.password && (
                  <p className="text-sm text-red-600 mt-1">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...signupForm.register("confirmPassword")}
                  className="mt-1"
                />
                {signupForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{signupForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary-600 hover:bg-primary-700"
                disabled={signupMutation.isPending}
              >
                {signupMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-gray-600 mt-4">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Button
              variant="link"
              className="text-primary-600 hover:text-primary-700 font-medium p-0 h-auto"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
